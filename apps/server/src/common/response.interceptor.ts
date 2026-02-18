import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponseFormat<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseFormat<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    // 排除 Swagger 路径
    if (request.url.startsWith('/api/docs')) {
      return next.handle() as unknown as Observable<ApiResponseFormat<T>>;
    }

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
      })),
    );
  }
}
