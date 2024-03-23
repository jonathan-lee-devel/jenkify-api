import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import e from 'express';

import { PassportStrategies } from '../../../../constants/auth.constants';
import { User } from '../../models/User.model';
import { UsersService } from '../../services/users/users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard(PassportStrategies.JWT))
  async getProfile(@Request() req: e.Request) {
    const user = (req as any).user as User;
    return this.usersService.getUserProfile(user.email);
  }
}
