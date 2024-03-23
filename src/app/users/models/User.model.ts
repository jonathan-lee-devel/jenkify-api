import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import mongoose from 'mongoose';

import {UserProfile} from './UserProfile.model';
import {AbstractModel} from '../../../data/abstract.model';

@Schema({timestamps: true})
export class User extends AbstractModel {
  @Prop({required: true, unique: true})
  email: string;

  @Prop({required: true, unique: false})
  isEmailVerified: boolean;

  @Prop({required: false, unique: true})
  googleId?: string;

  @Prop({required: false, unique: false})
  password?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: UserProfile.name,
    required: false,
    unique: true,
  })
  userProfile?: UserProfile;
}

export const UserSchema = SchemaFactory.createForClass(User);
