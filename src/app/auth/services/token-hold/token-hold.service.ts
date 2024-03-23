import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';

import {TokenHold} from '../../models/TokenHold.model';

@Injectable()
export class TokenHoldService {
  constructor(@InjectModel(TokenHold.name) private readonly tokenHoldModel: Model<TokenHold>) {
  }

  async createTokenHold(tokenHold: TokenHold) {
    return this.tokenHoldModel.create(tokenHold);
  }

  async getTokenHoldByTokenCode(tokenCode: string) {
    return this.tokenHoldModel.findOne({tokenCode}).exec();
  }
}
