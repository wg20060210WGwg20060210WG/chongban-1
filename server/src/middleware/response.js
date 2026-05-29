// 成功响应
export const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: Date.now()
  });
};

// 失败响应
export const errorResponse = (res, message = '操作失败', statusCode = 400, code = 'ERROR', details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message
    },
    timestamp: Date.now()
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};