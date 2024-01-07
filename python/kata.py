import json
import os
import random
import urllib.request

# easier to ready json formatting output, since indent=4 from json.dumps isn't working
import pprint

# calvin: don't need a bash script to add envi variables since we're using "os" in this python script
# though of course, we don't want to add our login creds to a github repo
os.environ['ODOO_HOST'] = "demo-telescopecasual.odoo.com"
os.environ['ODOO_PORT'] = '443'
os.environ['ODOO_PROTOCOL'] = "https"
os.environ['ODOO_DB'] = "demo-telescopecasual"
os.environ['ODOO_LOGIN'] = "exampleemail"
os.environ['ODOO_PASSWORD'] = "examplepassword"

def load_config():
    return {
        "HOST": os.environ.get("ODOO_HOST"),
        "PORT": os.environ.get("ODOO_PORT"),
        "PROTOCOL": os.environ.get("ODOO_PROTOCOL"),
        "DB": os.environ.get("ODOO_DB"),
        "LOGIN": os.environ.get("ODOO_LOGIN"),
        "PASSWORD": os.environ.get("ODOO_PASSWORD"),
    }


def json_rpc(url, method, params):
    data = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": random.randint(0, 1000000000),
    }
    
    req = urllib.request.Request(
        url=url,
        data=json.dumps(data).encode(),
        headers={
            "Content-Type": "application/json",
        },
    )
    reply = json.loads(urllib.request.urlopen(req).read().decode("UTF-8"))
    if reply.get("error"):
        raise Exception(reply["error"])
    return reply["result"]


def call(url, service, method, *args):
    return json_rpc(url, "call", {"service": service, "method": method, "args": args})


class OdooSession:
    def __init__(self, host, port, protocol, db, user, password):
        self.URL = f"{protocol}://{host}:{port}/jsonrpc"
        print("URL:", self.URL)
        self.DB = db
        self.LOGIN = user
        self.PASSWORD = password
        self.UID = None

    def login(self):
        rs = call(self.URL, "common", "login", self.DB, self.LOGIN, self.PASSWORD)
        self.UID = rs

    def search_read(self, model, domain, fields, offset=0, limit=None, order=None):
        return call(
            self.URL,
            "object",
            "execute",
            self.DB,
            self.UID,
            self.PASSWORD,
            model,
            "search_read",
            domain,
            fields,
            offset,
            limit,
            order,
        )

    def get_all_employees(self):
        return self.search_read("hr.employee", [], ["name", "job_title"])    
    
    def get_job_titles(self):
        return self.search_read("hr.employee", [], ["job_title"])
    
    def count_job_titles(self):
        get_job_titles = odoo.get_job_titles()
        job_title_count = {}
        for employee in get_job_titles:
            job_title = employee.get("job_title")
            if job_title:
                if job_title in job_title_count:
                    job_title_count[job_title] += 1
                else:
                    job_title_count[job_title] = 1
        return job_title_count


if __name__ == "__main__":
    # Example: Connect to the remote server, query all the employees and print 2 records
    config = load_config()
    odoo = OdooSession(
        config["HOST"],
        config["PORT"],
        config["PROTOCOL"],
        config["DB"],
        config["LOGIN"],
        config["PASSWORD"],
    )
    odoo.login()
    # all_employees = odoo.get_all_employees()
    # jobtitles = odoo.get_job_titles()
    # show_model = odoo.show_model("hr.employee")
    # pprint.pprint(show_model)
    
    job_title_count = odoo.count_job_titles()
    # pprint.pprint(job_title_count)         
        
    # get count / for number of times a job title appears
    def get_count(item):
        return item[1]

    # dictionary sort
    sorted_job_titles = dict(sorted(job_title_count.items(), key=get_count, reverse=True))

    # print by count
    for job_title, count in sorted_job_titles.items():
        pprint.pprint(f"Telescope has ({count}), {job_title}")        

# TODO:
# 1. Connect to the remote Odoo server 
# 2. # and query the number of unique job titles,
# 3. then print them out in order of most common to least common.
#
# You may use the boilerplate above or roll your own. If you feel like some light
# reading here are some links, but don't worry, there isn't a quiz :)
#  - https://www.odoo.com/documentation/16.0/developer/howtos/web_services.html
#  - https://www.odoo.com/documentation/16.0/developer/reference/external_api.html
