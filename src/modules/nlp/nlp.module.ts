import { Module } from '@nestjs/common';
import { NLPService } from './services/nlp.service';

/**
 * Module for Natural Language Processing services
 */
@Module({
  providers: [NLPService],
  exports: [NLPService],
})
export class NLPModule {} 