import { Injectable } from '@angular/core';
import { ApiPreprocessor } from '../api-preprocessor';
import { sourceConfig } from '../../appConstants';
import { PreprocessorService } from './preprocessor.service';
import { Content } from '../content/models/content';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class DikshaPreprocessorService implements ApiPreprocessor {
  sunbirdConfig!: Content;
  processorArray!: Array<any>;
  constructor(private apiService: ApiService,
    private preprocessService: PreprocessorService) {}

  async process(input: sourceConfig) {
    
    
  }
}
