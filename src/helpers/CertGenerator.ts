import fs from 'fs-extra';
import { generate } from 'selfsigned';
import { Config } from '../interfaces/Config.interface';

export class CertGenerator {
  public static generate(config: Config): {
    key: string;
    cert: string;
  } | null {
    try {
      const keyPath = `${config.cachePath}/ssl/server.key`;
      const certPath = `${config.cachePath}/ssl/server.crt`;

      const keyExists = fs.existsSync(keyPath);
      const certExists = fs.existsSync(certPath);

      if (!keyExists || !certExists) {
        const { pemCert, pemKey } = CertGenerator.generateKeyPairAndCertificate();

        fs.outputFileSync(keyPath, pemKey);
        fs.outputFileSync(certPath, pemCert);

        return {
          key: keyPath,
          cert: certPath,
        };
      } else {
        return {
          key: keyPath,
          cert: certPath,
        };
      }
    } catch {
      console.error('Cannot generate ParrotJS Server certificates.');
    }
    return null;
  }

  private static generateKeyPairAndCertificate() {
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = generate(attrs, { days: 365 });

    return { pemCert: pems.cert, pemKey: pems.private };
  }
}
