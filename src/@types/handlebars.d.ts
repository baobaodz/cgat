import 'handlebars';

declare module 'handlebars' {
  interface HelperOptions {
    fn: Handlebars.TemplateDelegate<any>; 
    hash: any;

  }

  interface RuntimeOptions {
    allowProtoPropertiesByDefault?: boolean;
    allowProtoMethodsByDefault?: boolean;
  }
}
