import json
import os
import random
import urllib.request

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

    def get_all_job_titles(self):
        return self.search_read("hr.employee", [], ["job_title"])

    def get_job_title_count(self):
        job_titles = odoo.get_all_job_titles()
        title_count = {}
        for employee in job_titles:
            title = employee.get("job_title")
            if not title: continue

            if title in title_count:
                title_count[title] += 1
                continue
            
            title_count[title] = 1
                
        return title_count

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
    job_title_count = odoo.get_job_title_count()

    def as_count(item):
        return item[1]
    
    job_titles_sorted = sorted(job_title_count.items(), key=as_count, reverse=True)
    
    for title, count in job_titles_sorted:
        print(f"{title}, ({count})")    

# TODO: Connect to the remote Odoo server and query the number of unique job titles,
# then print them out in order of most common to least common.
#
# You may use the boilerplate above or roll your own. If you feel like some light
# reading here are some links, but don't worry, there isn't a quiz :)
#  - https://www.odoo.com/documentation/16.0/developer/howtos/web_services.html
#  - https://www.odoo.com/documentation/16.0/developer/reference/external_api.html