import mongoose from 'mongoose';

export class AbstractModel {
  _id?: mongoose.Types.ObjectId;

  createdAt?: Date;

  updatedAt?: Date;
}
