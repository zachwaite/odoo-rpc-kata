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

// Get the environment variables
require('dotenv').config();

// Boilerplate needed to connect to Odoo's JSON-RPC API :(
const loadConfig = () => {
  return {
    HOST: process.env.ODOO_HOST,
    PORT: parseInt(process.env.ODOO_PORT),
    PROTOCOL: process.env.ODOO_PROTOCOL,
    DB: process.env.ODOO_DB,
    LOGIN: process.env.ODOO_LOGIN,
    PASSWORD: process.env.ODOO_PASSWORD,
  };
};

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

  // Convert all employees to an array so we can do pre-processing
  const allEmployeesToArray = (await Promise.all(allEmployees.result));
  
  // Process the array, get overall counts
  const getJobTitleCount = allEmployeesToArray.reduce((getJobTitleCount, employees) =>
  {
    getJobTitleCount[employees.job_title] = (getJobTitleCount[employees.job_title] || 0) + 1;
    return getJobTitleCount;
  }, {});

  // Sort the array from most common to least common
  const sortedTitles = Object.entries(getJobTitleCount).sort((p0, p1) =>
  {
    return p0[1] < p1[1] ? 1 : -1;
  });

  // Print list out in sorted order (common - unCommon)
  sortedTitles.forEach((sortedElement) => console.log(sortedElement[0]));
})();

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
