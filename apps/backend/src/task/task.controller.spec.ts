import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { BanGuard } from '../user/ban.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('TaskController', () => {
  let controller: TaskController;

  beforeEach(async () => {
    const mockTask = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), findRelated: jest.fn() };
    const mockPrisma = { user: { findUnique: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: mockTask },
        { provide: PrismaService, useValue: mockPrisma },
        BanGuard,
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
