import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { renderCharacterSheetPdf } from "./character-sheet-pdf.js";
import { createTestApp, type TestApp } from "./test-app.js";
import { createWizard } from "./test-characters.js";

describe("Export PDF de la fiche", () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp();
  }, 60_000);

  afterAll(async () => {
    await testApp.close();
  });

  it("renvoie la fiche en PDF à télécharger", async () => {
    const id = await createWizard(testApp);
    const response = await http()
      .get(`/characters/${id}/sheet.pdf`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(response.headers["content-disposition"]).toBe('attachment; filename="elara.pdf"');
    expect((response.body as Buffer).subarray(0, 8).toString()).toBe("%PDF-1.7");
  });

  it("produit un PDF balisé, en français, avec un titre de document", async () => {
    const id = await createWizard(testApp);
    const character = (await http().get(`/characters/${id}`)).body;
    const pdf = (await renderCharacterSheetPdf(character, { compress: false })).toString("latin1");
    expect(pdf).toContain("/MarkInfo");
    expect(pdf).toContain("/StructTreeRoot");
    expect(pdf).toContain("/Lang (fr-FR)");
    expect(pdf).toContain("/DisplayDocTitle true");
    for (const tag of ["/S /Document", "/S /H1", "/S /H2", "/S /P", "/S /L", "/S /LI"]) {
      expect(pdf).toContain(tag);
    }
  });

  it("404 pour un personnage inconnu", async () => {
    await http().get("/characters/00000000-0000-4000-8000-000000000000/sheet.pdf").expect(404);
  });
});
