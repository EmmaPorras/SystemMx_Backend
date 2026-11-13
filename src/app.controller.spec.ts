import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should return health check status ok', () => {
      const health = appController.getHealth();
      expect(health.status).toBe('ok');
      expect(health.service).toBe('systemmx-backend');
      expect(health.timestamp).toBeDefined();
    });

    it('should return api root status ok', () => {
      const api = appController.getApi();
      expect(api.status).toBe('ok');
      expect(api.service).toBe('systemmx-backend');
    });

    it('should return api health status ok', () => {
      const apiHealth = appController.getApiHealth();
      expect(apiHealth.status).toBe('ok');
      expect(apiHealth.service).toBe('systemmx-backend');
    });

    it('should return the deployed commit in api health', () => {
      const gitSha = '0a197fa97e10536dbd5b2d383894d27a60385417';
      const env = jest.replaceProperty(process, 'env', {
        ...process.env,
        GIT_SHA: gitSha,
      });

      try {
        expect(appController.getApiHealth().commit).toBe(gitSha);
      } finally {
        env.restore();
      }
    });
  });
});
