const mcache = require('memory-cache');

const cache = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedResponse = mcache.get(key);

    if (cachedResponse) {
      return res.send(cachedResponse);
    }

    res.sendResponse = res.send;
    res.send = (body) => {
      mcache.put(key, body, duration);
      res.sendResponse(body);
    };
    next();
  };
};

module.exports = cache;