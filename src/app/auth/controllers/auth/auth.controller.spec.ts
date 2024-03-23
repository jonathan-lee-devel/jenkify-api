import {TestBed} from '@automock/jest';

import {AuthController} from './auth.controller';


describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const {unit} = TestBed.create(AuthController).compile();
    controller = unit;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
