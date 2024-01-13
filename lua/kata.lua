requests = require("requests")

function load_config()
    return {
        HOST = os.getenv("ODOO_HOST"),
        PORT = os.getenv("ODOO_PORT"),
        PROTOCOL = os.getenv("ODOO_PROTOCOL"),
        DB = os.getenv("ODOO_DB"),
        LOGIN = os.getenv("ODOO_LOGIN"),
        PASSWORD = os.getenv("ODOO_PASSWORD")
    }
end

function json_rpc(url, method, params)
    local data = {
        jsonrpc = "2.0",
        method = method,
        params = params,
        id = math.random(1, 99999999)
    }
    local headers = {["Content-Type"] = "application/json"}
    local rs =
        requests.post(
        {
            url,
            data = data,
            headers = headers
        }
    )
    return rs.json()
end

function call(url, service, method, args)
    local rs = json_rpc(url, "call", {service = service, method = method, args = args})
    return rs.result
end

--- use the module pattern via a factory function to encapsulate like a class
function odoo_session(host, port, protocol, db, user, password)
    local url = protocol .. "://" .. host .. ":" .. port .. "/jsonrpc"

    function login()
        return call(url, "common", "login", {db, user, password})
    end

    function read_group(model, domain, fields, groupby_fields, offset, limit, order)
        local uid = login()
        return call(
            url,
            "object",
            "execute",
            {
                db,
                uid,
                password,
                model,
                "read_group",
                domain,
                fields,
                groupby_fields,
                offset,
                limit,
                order
            }
        )
    end

    function get_all_employees_by_job_title()
        -- hack: add { "active", "=", true } to domain
        -- or else the server will think you're sending a dict
        local raw = read_group("hr.employee", {{"active", "=", true}}, {"name", "job_title"}, {"job_title"})
        local cooked = {}
        for _, rec in ipairs(raw) do
            table.insert(cooked, {rec["job_title"], rec["job_title_count"]})
        end
        table.sort(
            cooked,
            function(a, b)
                return a[2] > b[2]
            end
        )
        return cooked
    end

    return {
        get_all_employees_by_job_title = get_all_employees_by_job_title
    }
end

--main
config = load_config()
odoo = odoo_session(config.HOST, config.PORT, config.PROTOCOL, config.DB, config.LOGIN, config.PASSWORD)
data = odoo.get_all_employees_by_job_title()
for _, rec in ipairs(data) do
    local msg = rec[1] .. "= " .. rec[2]
    print(msg)
end

