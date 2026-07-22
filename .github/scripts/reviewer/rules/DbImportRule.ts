import { Rule, Evidence } from '../types/finding';

export class DbImportRule implements Rule {
  name = "DbImportRule";

  run(sourceFile: any, changedLines: number[], isNewFile: boolean): { critical: string[], findings: Evidence[] } {
    const critical: string[] = [];
    const Evidences: Evidence[] = [];
    const filePath = sourceFile.getFilePath().replace(/\\/g, '/');
    
    const isChanged = (node: any) => {
      const start = node.getStartLineNumber();
      const end = node.getEndLineNumber();
      return changedLines.some(l => l >= start && l <= end);
    };

    if (filePath.includes('/pages/') || filePath.includes('/app/')) {
      sourceFile.getImportDeclarations().forEach((imp: any) => {
        if (isChanged(imp)) {
          const moduleSpecifier = imp.getModuleSpecifierValue();
          if (moduleSpecifier.match(/db|database|prisma|typeorm|sql/i)) {
            Evidences.push({
               schemaVersion: 1,
               id: `ARCH-DB-${imp.getStartLineNumber()}`,
               type: 'architecture',
               source: 'ast',
               severity: 'HIGH',
               attributes: { moduleSpecifier },
               evidence: `Forbidden Import: '${moduleSpecifier}' detected in page/routing layer at line ${imp.getStartLineNumber()}.`
            });
          }
        }
      });
    }

    return { critical, findings: Evidences };
  }
}
