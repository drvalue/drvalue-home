import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InquiryEntity } from '../../../common/entity/inquiry.entity';

@Injectable()
export class InquiryDefaultRepository {
  constructor(
    @InjectRepository(InquiryEntity)
    readonly repository: Repository<InquiryEntity>,
  ) {}
}
