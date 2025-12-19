import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Candidate, CandidateSchema } from '../employee-profile/models/candidate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
    ]),
  ],
  exports: [MongooseModule], // 🔴 IMPORTANT
})
export class CandidateModule {}
