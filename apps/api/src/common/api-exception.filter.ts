import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = error instanceof HttpException ? error.getResponse() : undefined;
    const objectPayload = typeof payload === 'object' && payload !== null ? payload : {};
    const rawMessage =
      typeof payload === 'string'
        ? payload
        : 'message' in objectPayload
          ? (objectPayload as { message: unknown }).message
          : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : status === 500
          ? '서버에서 요청을 처리하지 못했습니다.'
          : '요청을 처리하지 못했습니다.';

    response.status(status).json({
      code:
        'code' in objectPayload && typeof (objectPayload as { code?: unknown }).code === 'string'
          ? (objectPayload as { code: string }).code
          : `HTTP_${status}`,
      message,
      details: status === 500 ? undefined : objectPayload,
      requestId: String(request.headers['x-request-id'] || 'unknown'),
    });
  }
}
