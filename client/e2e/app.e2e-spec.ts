import { VersoPage } from './app.po';

describe('verso-client App', () => {
  let page: VersoPage;

  beforeEach(() => {
    page = new VersoPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
