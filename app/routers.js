const path = require('path');
const Router = require('koa-router');
const DB = require('./libs/mysql');
const _ = require('lodash');

const router = new Router();

const resourceContract = {
  list: {
    action: (route, data) => {
      router.get(route, async (ctx) => {
        const rows = await data.list();
        ctx.body = rows;
      });
    },
  },
  get: {
    action: (route, data) => {
      router.get(route, async (ctx) => {
        try {
          const rows = await data.get(ctx.params);
          if (!rows.length) {
            ctx.status = 404;
            ctx.body = { message: 'recored not found' };
          } else {
            ctx.body = rows[0];
          }
        } catch (e) {
          ctx.status = 401;
          ctx.body = String(e);
        }
      });
    },
    param: 'id',
  },
  post: {
    action: (route, data) => {
      router.post(route, async (ctx) => {
        try {
          await data.post(ctx.request.body);
          ctx.status = 204;
        } catch (e) {
          ctx.body = String(e);
          ctx.status = 401;
        }
      });
    },
  },
  put: {
    action: (route, data) => {
      router.put(route, async (ctx) => {
        const value = ctx.request.body;
        _.assign(value, ctx.params);
        try {
          await data.put(value);
          ctx.status = 204;
        } catch (e) {
          ctx.status = 401;
          ctx.body = String(e);
        }
      });
    },
    param: 'id',
  },
  delete: {
    action: (route, data) => {
      router.delete(route, async (ctx) => {
        const params = ctx.params;
        try {
          await data.delete(params);
          ctx.status = 204;
        } catch (e) {
          ctx.status = 401;
          ctx.body = String(e);
        }
      });
    },
    param: 'id',
  },
};
const resourceFactory = (route, data) => {
  for (const key in data) {
    let _route = route;
    if (resourceContract[key].action) {
      if (resourceContract[key].param) {
        _route = path.resolve(route, `:${resourceContract[key].param}`);
      }
      resourceContract[key].action(_route, data);
    }
  }
};


module.exports = (app) => {
  resourceFactory('/subject', DB.Subject);
  resourceFactory('/chapter', DB.Chapter);
  resourceFactory('/tag', DB.Tag);
  resourceFactory('/question', DB.Question);
  resourceFactory('/paper', DB.Paper);

  router.get('/subject/disabled', async (ctx) => {
    const subjects = await DB.Subject.get(0);
    ctx.body = subjects;
  });

  app.use(router.routes())
    .use(router.allowedMethods());
};
