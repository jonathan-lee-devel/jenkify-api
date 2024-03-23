import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';

import {AbstractModel} from '../../../data/abstract.model';

@Schema({timestamps: true})
export class TokenHold extends AbstractModel {
  @Prop({required: true, unique: false})
  email: string;

  @Prop({required: true, unique: false})
  accessToken: string;

  @Prop({required: true, unique: true})
  tokenCode: string;

  @Prop({required: true, unique: false})
  refreshToken: string;

  @Prop({required: true, unique: false})
  expiryDate: Date;
}

export const TokenHoldSchema = SchemaFactory.createForClass(TokenHold);
