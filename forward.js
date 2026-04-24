const _scriptSonverterCompatibilityType = typeof $response !== 'undefined' ? 'response' : typeof $request !== 'undefined' ? 'request' : ''
const _scriptSonverterCompatibilityDone = $done
try {
  
// 转换时间: 2026/4/25 00:21:02
// 兼容性转换
if (typeof $request !== 'undefined') {
  const lowerCaseRequestHeaders = Object.fromEntries(
    Object.entries($request.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $request.headers = new Proxy(lowerCaseRequestHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}
if (typeof $response !== 'undefined') {
  const lowerCaseResponseHeaders = Object.fromEntries(
    Object.entries($response.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $response.headers = new Proxy(lowerCaseResponseHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}
Object.getOwnPropertyNames($httpClient).forEach(method => {
  if(typeof $httpClient[method] === 'function') {
    $httpClient[method] = new Proxy($httpClient[method], {
      apply: (target, ctx, args) => {
        for (let field in args?.[0]?.headers) {
          if (['host'].includes(field.toLowerCase())) {
            delete args[0].headers[field];
          } else if (['number'].includes(typeof args[0].headers[field])) {
            args[0].headers[field] = args[0].headers[field].toString();
          }
        }
        return Reflect.apply(target, ctx, args);
      }
    });
  }
})

/*
 * fw
 * 
[rewrite_local]
^https://fluxapi\.vvebo\.vip/v1/purchase/iap/subscription url script-analyze-echo-response https://mock.forward1.workers.dev/forward/qx-response.js

[mitm]
hostname = fluxapi.vvebo.vip
 */

const StatusTexts = {
  200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
  500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable"
};

const requestUrl = $request.url;
const requestHeaders = $request.headers;
const requestBody = $request.body;

const options = {
  url: "https://mock.forward1.workers.dev/forward/v1/purchase/iap/subscription",
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "X-Auth-Key": requestHeaders["x-auth-key"] || ""
  },
  body: requestBody,
  timeout: 10000
};

$task.fetch(options).then(
  response => {
    $done({
      status: `HTTP/1.1 ${response.statusCode || 200} ${StatusTexts[response.statusCode || 200]}`,
      headers: response.headers || {
        server: "openresty",
        date: new Date().toUTCString(),
        "content-type": "application/json; charset=utf-8",
      },
      body: response.body
    });
  },
  reason => {
    console.log("Request failed:", reason);
    $done({
      status: "HTTP/1.1 500 Internal Server Error",
      headers: {
        server: "openresty",
        date: new Date().toUTCString(),
        "content-type": "application/json; charset=utf-8",
      },
      body: '{"error":"Request failed"}'
    });
  }
);
} catch (e) {
  console.log('❌ Script Hub 兼容层捕获到原脚本未处理的错误')
  if (_scriptSonverterCompatibilityType) {
    console.log('⚠️ 故不修改本次' + (_scriptSonverterCompatibilityType === 'response' ? '响应' : '请求'))
  } else {
    console.log('⚠️ 因类型非请求或响应, 抛出错误')
  }
  console.log(e)
  if (_scriptSonverterCompatibilityType) {
    _scriptSonverterCompatibilityDone({})
  } else {
    throw e
  }
  }
