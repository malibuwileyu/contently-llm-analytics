import { Module } from '@nestjs/common';
import { NLPService } from './nlp.service';
import { AIProviderModule } from '../ai-provider/ai-provider.module';

@Module({
  imports: [AIProviderModule],
  providers: [NLPService],
  exports: [NLPService],
})
export class NLPModule {} 