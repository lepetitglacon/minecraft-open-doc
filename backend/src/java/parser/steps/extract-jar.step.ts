import { ParseStep } from './parse-step';
import { JarExtractorService, ExtractedData } from '../jar-extractor.service';

export interface ExtractJarInput {
  jarPath: string;
}

export class ExtractJarStep extends ParseStep<ExtractJarInput, ExtractedData> {
  readonly name = 'extract';

  constructor(private readonly jarExtractor: JarExtractorService) {
    super();
  }

  async execute(input: ExtractJarInput): Promise<ExtractedData> {
    this.start('Extracting JAR contents...');

    const extracted = await this.jarExtractor.extract(input.jarPath);

    this.complete(
      `Extracted ${extracted.blockstates.length} blocks, ${extracted.textures.length} textures, ${extracted.models.length} models`,
    );

    return extracted;
  }
}
