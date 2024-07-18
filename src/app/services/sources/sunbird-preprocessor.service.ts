import { Injectable } from '@angular/core';
import { ApiPreprocessor } from '../api-preprocessor';
import { PreprocessorService } from './preprocessor.service';
import { Mapping, MappingElement, Source } from '../config/models/config';
import { Content, ContentMetaData } from '../content/models/content';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class SunbirdPreprocessorService implements ApiPreprocessor {
  botConfig!: Content;
  processorContentList!: Array<any>;
  constructor(private apiService: ApiService,
    private preprocessService: PreprocessorService) { }

  async process(source: Source, mappingElement: MappingElement | undefined) {
   

  }
}
