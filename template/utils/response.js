function badRequest(ctx, message) {
  ctx.status = 400;
  return {
    result: false,
    msg: message || 'BAD REQUEST'
  }
}

function notFound(ctx) {
  ctx.status = 404;
  return {
    result: false,
    msg: 'NOT FOUND'
  }
}

function serverError(ctx, error) {
  console.log(error);
  ctx.status = 500;
  return ctx.body = {
    result: false,
    msg: 'SERVER ERROR \n' + error
  };
}

function success(ctx, data) {
  ctx.status = 200;
  return ctx.body = {
    result: true,
    data
  }
}

module.exports = {
  badRequest,
  notFound,
  serverError,
  success
}
