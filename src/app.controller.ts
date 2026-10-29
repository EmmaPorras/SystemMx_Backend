import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'systemmx-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('api')
  getApi() {
    return {
      status: 'ok',
      service: 'systemmx-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('api/health')
  getApiHealth() {
    return {
      status: 'ok',
      service: 'systemmx-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
