This is a prototype of an alternate version of `MatTable` built on top of
[MDC Web](https://github.com/material-components/material-components-web). This component is experimental and should not be used in production.

## How to use
Assuming your application is already up and running using Angular Material, you can add this component by following these steps:

1. Install `@angular/material-experimental` and MDC Web:

   ```bash
   npm i material-components-web @angular/material-experimental
   ```

2. In your `angular.json`, make sure `node_modules/` is listed as a Sass include path. This is
   needed for the Sass compiler to be able to find the MDC Web Sass files.

   ```json
   ...
   "styles": [
     "src/styles.scss"
   ],
   "stylePreprocessorOptions": {
     "includePaths": [
       "node_modules/"
     ]
   },
   ...
   ```

3. Import the experimental `MatTableModule` and add it to the module that declares your component:

   ```ts
   import {MatTableModule} from '@angular/material-experimental/mdc-table';

   @NgModule({
     declarations: [MyComponent],
     imports: [MatTableModule],
   })
   export class MyModule {}
   ```

4. Use the table in your component's template:

   ```html
     <table mat-table [dataSource]="dataSource">

     <ng-container matColumnDef="position">
       <th mat-header-cell *matHeaderCellDef> No. </th>
       <td mat-cell *matCellDef="let data"> {{data.position}} </td>
     </ng-container>

     <ng-container matColumnDef="name">
       <th mat-header-cell *matHeaderCellDef> Name </th>
       <td mat-cell *matCellDef="let data"> {{data.name}} </td>
     </ng-container>

     <tr mat-header-row *matHeaderRowDef="myColumns"></tr>
     <tr mat-row *matRowDef="let row; columns: myColumns;"></tr>
    </table>


   ```

5. Add the theme mixins to your Sass:

   ```scss
   @use '@angular/material' as mat;
   @use '@angular/material-experimental' as mat-experimental;

   $candy-app-primary: mat.define-palette(mat.$indigo-palette);
   $candy-app-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
   $candy-app-theme: mat.define-light-theme((
     color: (
       primary: $candy-app-primary,
       accent: $candy-app-accent,
     )
   ));


   @include mat-experimental.mdc-table-theme($candy-app-theme);
   ```

## API differences

The API of the table matches the one from `@angular/material/table`. Simply replace imports to
`@angular/material/table` with imports to `@angular/material-experimental/mdc-table`.
