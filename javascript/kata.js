/**
 * Title: odoo-rpc-kata
 * Author: Zach Waite
 *
 * Developed on nodejs 20.4.0, should work on >19.x
 *
 *
 * Go to the bottom of the file for instructions
 *
 *
 */

// Boilerplate needed to connect to Odoo's JSON-RPC API :(
require("dotenv").config();

const loadConfig = () => {
  return {
    HOST: process.env.HOST,
    PORT: parseInt(process.env.PORT),
    PROTOCOL: process.env.PROTOCOL,
    DB: process.env.DB,
    LOGIN: process.env.LOGIN,
    PASSWORD: process.env.PASSWORD,
  };
};

console.log(loadConfig());

const jsonRpc = async (url, method, params) => {
  const data = {
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: Math.floor(Math.random() * 100000),
  };
  const out = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return out.json();
};

const call = async (url, service, method, args) => {
  return jsonRpc(url, "call", { service: service, method: method, args: args });
};

const OdooSessionMaker = (host, port, protocol, db, user, password) => {
  return () => {
    const URL = `${protocol}://${host}:${port}/jsonrpc`;
    const DB = db;
    const LOGIN = user;
    const PASSWORD = password;
    let UID = undefined;

    const login = async () => {
      const rs = await call(URL, "common", "login", [DB, LOGIN, PASSWORD]);
      UID = rs.result;
    };

    const search_read = async (
      model,
      domain,
      fields,
      offset = 0,
      limit = null,
      order = null
    ) => {
      const rs = await call(URL, "object", "execute", [
        DB,
        UID,
        PASSWORD,
        model,
        "search_read",
        domain,
        fields,
        offset,
        limit,
        order,
      ]);

      return rs;
    };

    const getAllEmployees = async () => {
      return search_read("hr.employee", [], ["name", "job_title"]);
    };

    return { login, search_read, getAllEmployees };
  };
};
// End Boilerplate :)

// ========================= main ====================================================
// Example: Connect to the remote server, query all the employees and print 2 records

// (async () => {
//   const config = loadConfig();
//   const odoo = OdooSessionMaker(
//     config.HOST,
//     config.PORT,
//     config.PROTOCOL,
//     config.DB,
//     config.LOGIN,
//     config.PASSWORD
//   )();
//   await odoo.login();
//   const allEmployees = await odoo.getAllEmployees();
//   console.log(allEmployees.result.slice(0, 2));
// })();

/**
 * TODO: Connect to the remote Odoo server and query the number of unique job titles,
 * then print them out in order of most common to least common.
 *
 * You may use the boilerplate above or roll your own. If you feel like some light
 * reading here are some links, but don't worry, there isn't a quiz :)
 *  - https://www.odoo.com/documentation/16.0/developer/howtos/web_services.html
 *  - https://www.odoo.com/documentation/16.0/developer/reference/external_api.html
 *
 */

(async () => {
  const config = loadConfig();
  const odoo = OdooSessionMaker(
    config.HOST,
    config.PORT,
    config.PROTOCOL,
    config.DB,
    config.LOGIN,
    config.PASSWORD
  )();
  await odoo.login();

  const allEmployees = await odoo.getAllEmployees();

  // build an object that maps job_titles to their frequency in allEmployees
  const jobTitleCount = {};
  allEmployees.result.forEach((employee) => {
    jobTitleCount[employee.job_title] =
      (jobTitleCount[employee.job_title] || 0) + 1;
  });

  // sort from most to least frequent
  const sorted = Object.entries(jobTitleCount).sort((a, b) => {
    return a[1] < b[1] ? 1 : -1;
  });

  console.log(jobTitleCount);
  sorted.forEach((element) => console.log(element[0]));
})();
