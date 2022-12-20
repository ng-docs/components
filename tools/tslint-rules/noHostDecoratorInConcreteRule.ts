import ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.AbstractRule {
  apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new Walker(sourceFile, this.getOptions()));
  }
}

class Walker extends Lint.RuleWalker {
  override visitClassDeclaration(node: ts.ClassDeclaration) {
    if (!node.modifiers || !this.getOptions().length) {
      return;
    }

    // Do not check the class if its abstract.
    if (!!node.modifiers.find(modifier => modifier.kind === ts.SyntaxKind.AbstractKeyword)) {
      return;
    }

    node.members.forEach(member => {
      if (
        !ts.isPropertyDeclaration(member) &&
        !ts.isMethodDeclaration(member) &&
        !ts.isGetAccessorDeclaration(member) &&
        !ts.isSetAccessorDeclaration(member)
      ) {
        return;
      }

      const decorators = ts.getDecorators(member);

      decorators?.forEach(decorator => {
        const decoratorText: string = decorator.getChildAt(1).getText();
        const matchedDecorator: string = this.getOptions().find((item: string) =>
          decoratorText.startsWith(item),
        );
        if (!!matchedDecorator) {
          this.addFailureFromStartToEnd(
            decorator.getChildAt(1).pos - 1,
            decorator.end,
            `The @${matchedDecorator} decorator may only be used in abstract classes. In ` +
              `concrete classes use \`host\` in the component definition instead.`,
          );
        }
      });
    });

    super.visitClassDeclaration(node);
  }
}
