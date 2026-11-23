import { describe, expect, it } from "vitest";
import { stackLayout } from "../responsive/stack-layout";
import {
  addCardToComponent,
  deleteCardFromComponent,
  duplicateCardInComponent,
  fillComponentWithThreeCards,
  findRootCardId,
  getContainerCards,
  reorderCardInComponent,
  reorderElementInComponent,
  addButtonToComponent,
  createDefaultMunicipalFooter,
  createDefaultMunicipalHeader,
  organizeFooterIntoColumns,
  moveElementToFooterColumn,
  addLinkToFooterColumn,
  moveElementOrderInComponent,
  createMunicipalSearchHero,
  createMunicipalSearchList,
  createTramitesLeyesDecretos,
  getComponentOptions,
  getCardsForOption,
  addCardToOption,
  duplicateCardInOption,
  deleteCardFromOption,
  moveCardToOption,
  updateOptionLabel,
} from "./container-card-rules";
import { SECTION_KEY, type ComponentDef } from "./types";
import { newElement } from "./component-templates";

const makeTestComponent = (): ComponentDef => ({
  id: "test-comp",
  name: "Contenedor de prueba",
  description: "Pruebas de auto-layout",
  category: "cards",
  width: 960,
  height: 240,
  custom: true,
  links: {},
  elements: [
    newElement("rect", "card-1", { role: "container", x: 0, y: 0, width: 200, height: 180 }),
    newElement("text", "card-1-title", { parentId: "card-1", role: "heading", text: "Tarjeta Alfa" }),
    newElement("rect", "card-2", { role: "container", x: 220, y: 0, width: 200, height: 180 }),
    newElement("text", "card-2-title", { parentId: "card-2", role: "heading", text: "Tarjeta Beta" }),
  ],
});

describe("container-card-rules", () => {
  it("obtiene la información de las tarjetas en el contenedor", () => {
    const comp = makeTestComponent();
    const cards = getContainerCards(comp);
    expect(cards).toHaveLength(2);
    expect(cards[0].id).toBe("card-1");
    expect(cards[0].title).toBe("Tarjeta Alfa");
    expect(cards[1].id).toBe("card-2");
    expect(cards[1].title).toBe("Tarjeta Beta");
  });

  it("encuentra el id raíz de la tarjeta para cualquier elemento hijo", () => {
    const comp = makeTestComponent();
    expect(findRootCardId(comp.elements, "card-1")).toBe("card-1");
    expect(findRootCardId(comp.elements, "card-1-title")).toBe("card-1");
  });

  it("duplica una tarjeta completa con sus hijos", () => {
    const comp = makeTestComponent();
    const { component: updated, newCardId } = duplicateCardInComponent(comp, "card-1");
    const cards = getContainerCards(updated);
    expect(cards).toHaveLength(3);
    expect(cards[1].id).toBe(newCardId);
    expect(cards[1].title).toBe("Tarjeta Alfa");
    // Verifica que los hijos de la nueva tarjeta tengan parentId apuntando a la nueva tarjeta
    const newChildren = updated.elements.filter((e) => e.parentId === newCardId);
    expect(newChildren).toHaveLength(1);
    expect(newChildren[0].text).toBe("Tarjeta Alfa");
  });

  it("agrega una nueva tarjeta estilizada al contenedor", () => {
    const comp = makeTestComponent();
    const { component: updated, newCardId } = addCardToComponent(comp, "Tarjeta Gamma");
    const cards = getContainerCards(updated);
    expect(cards).toHaveLength(3);
    expect(cards[2].id).toBe(newCardId);
    expect(cards[2].title).toBe("Tarjeta Gamma");
  });

  it("elimina una tarjeta y sus hijos", () => {
    const comp = makeTestComponent();
    const updated = deleteCardFromComponent(comp, "card-1-title"); // pasando hijo
    const cards = getContainerCards(updated);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("card-2");
    expect(updated.elements.some((e) => e.id === "card-1" || e.id === "card-1-title")).toBe(false);
  });

  it("rellena con 3 tarjetas automáticas", () => {
    const emptyComp: ComponentDef = { ...makeTestComponent(), elements: [] };
    const filled = fillComponentWithThreeCards(emptyComp);
    const cards = getContainerCards(filled);
    expect(cards).toHaveLength(3);
    expect(cards[0].title).toBe("Atención Vecinal");
    expect(cards[1].title).toBe("Pagos y Tributos");
    expect(cards[2].title).toBe("Seguridad y Apoyo");
  });

  it("reordena tarjetas en el contenedor", () => {
    const comp = makeTestComponent();
    const reordered = reorderCardInComponent(comp, "card-1", 1);
    const cards = getContainerCards(reordered);
    expect(cards[0].id).toBe("card-2");
    expect(cards[1].id).toBe("card-1");
  });

  it("reordena elementos arbitrarios por drag-and-drop antes o después de otro", () => {
    const comp = makeTestComponent();
    // Reordenar card-2 antes de card-1
    const reordered = reorderElementInComponent(comp, "card-2", "card-1", "before");
    const cards = getContainerCards(reordered);
    expect(cards[0].id).toBe("card-2");
    expect(cards[1].id).toBe("card-1");

    // Los hijos se mantienen agrupados con su padre
    const card2Child = reordered.elements.find((e) => e.parentId === "card-2");
    expect(card2Child).toBeDefined();
  });

  it("agrega un nuevo botón a un componente de botones", () => {
    const btnComp: ComponentDef = { ...makeTestComponent(), category: "buttons", elements: [] };
    const { component: step1, newButtonId: b1 } = addButtonToComponent(btnComp, "Aceptar");
    expect(step1.elements).toHaveLength(1);
    expect(step1.elements[0].text).toBe("Aceptar");
    expect(step1.elements[0].role).toBe("button");

    const { component: step2 } = addButtonToComponent(step1, "Cancelar");
    expect(step2.elements).toHaveLength(2);
    expect(step2.elements[1].text).toBe("Cancelar");
  });

  it("crea el footer municipal predeterminado con 4 columnas", () => {
    const footer = createDefaultMunicipalFooter();
    expect(footer.elements.filter((e) => !e.parentId && e.role === "container")).toHaveLength(4);
    expect(footer.styles?.[SECTION_KEY]?.classes).toBe("w-full");
  });

  it("crea la cabecera municipal oficial con logo, enlaces y buscador", () => {
    const header = createDefaultMunicipalHeader();
    const logo = header.elements.find((e) => e.role === "image");
    expect(logo).toBeDefined();
    expect(logo?.src).toBe("/logo-municipal.png");

    const links = header.elements.filter((e) => e.role === "link");
    expect(links.map((l) => l.text)).toEqual([
      "Trámites y Leyes",
      "Cocha Unida",
      "GAMC",
      "Noticias",
      "Gabinete de Transparencia",
      "Servicios",
    ]);

    const searchBtn = header.elements.find((e) => e.control?.name === "search-trigger");
    expect(searchBtn).toBeDefined();
    expect(searchBtn?.text).toBe("⌕");
  });

  it("organiza elementos sueltos en columnas de footer", () => {
    const messyFooter: ComponentDef = {
      ...makeTestComponent(),
      id: "footer-test",
      name: "Footer suelto",
      elements: [
        newElement("rect", "bg", { width: 1024, height: 240, x: 0, y: 0, fill: "#0f172a" }),
        newElement("text", "t1", { text: "Portal Municipal", x: 20, y: 20 }),
        newElement("text", "t2", { text: "Trámites", x: 350, y: 20 }),
        newElement("text", "t3", { text: "Contacto", x: 700, y: 20 }),
      ],
    };
    const organized = organizeFooterIntoColumns(messyFooter, 3);
    const cols = organized.elements.filter((e) => !e.parentId && e.role === "container");
    expect(cols).toHaveLength(3);
    expect(organized.elements.filter((e) => e.parentId)).toHaveLength(3);
  });

  it("mueve un elemento de una columna a otra", () => {
    const footer = createDefaultMunicipalFooter();
    const cols = footer.elements.filter((e) => !e.parentId && e.role === "container");
    const childInCol1 = footer.elements.find((e) => e.parentId === cols[0].id && e.kind === "text")!;
    const moved = moveElementToFooterColumn(footer, childInCol1.id, 1);
    const movedChild = moved.elements.find((e) => e.id === childInCol1.id)!;
    expect(movedChild.parentId).toBe(cols[1].id);
  });

  it("agrega un enlace a una columna del footer", () => {
    const footer = createDefaultMunicipalFooter();
    const cols = footer.elements.filter((e) => !e.parentId && e.role === "container");
    const { component: updated, newLinkId } = addLinkToFooterColumn(footer, cols[1].id, "• Nuevo Trámite");
    const newLink = updated.elements.find((e) => e.id === newLinkId)!;
    expect(newLink.text).toBe("• Nuevo Trámite");
    expect(newLink.parentId).toBe(cols[1].id);
  });

  it("reordena elementos hermanos dentro de un contenedor", () => {
    const comp: ComponentDef = {
      ...makeTestComponent(),
      elements: [
        newElement("rect", "box", { role: "container" }),
        newElement("text", "title", { parentId: "box", text: "Título", y: 0 }),
        newElement("text", "desc", { parentId: "box", text: "Descripción", y: 30 }),
      ],
    };
    // Mover 'desc' hacia arriba (-1)
    const moved = moveElementOrderInComponent(comp, "desc", -1);
    const siblings = moved.elements.filter((e) => e.parentId === "box");
    expect(siblings[0].id).toBe("desc");
    expect(siblings[1].id).toBe("title");
    expect(siblings[0].y).toBe(0);
    expect(siblings[1].y).toBe(30);
  });

  it("reordena elementos de nivel raíz (tarjetas o elementos sueltos)", () => {
    const comp = makeTestComponent();
    // card-1 está antes de card-2; mover card-1 hacia abajo (1)
    const moved = moveElementOrderInComponent(comp, "card-1", 1);
    const cards = getContainerCards(moved);
    expect(cards[0].id).toBe("card-2");
    expect(cards[1].id).toBe("card-1");
  });

  it("detecta tarjetas y sus hijos geométricos sin parentId (diseño libre de compañeros)", () => {
    const flatComp: ComponentDef = {
      id: "flat-cards",
      name: "Tarjetas sueltas",
      description: "Prueba de tarjetas sin parentId",
      category: "sections",
      width: 1024,
      height: 340,
      custom: true,
      links: {},
      elements: [
        // Tarjeta 1
        newElement("rect", "card-1", { x: 20, y: 100, width: 180, height: 180, fill: "#bae6fd" }),
        newElement("text", "card-1-tag", { x: 30, y: 110, width: 100, height: 14, text: "TAG 1" }),
        newElement("text", "card-1-title", { x: 30, y: 140, width: 150, height: 24, text: "Servicio 1" }),
        // Tarjeta 2
        newElement("rect", "card-2", { x: 220, y: 100, width: 180, height: 180, fill: "#bae6fd" }),
        newElement("text", "card-2-tag", { x: 230, y: 110, width: 100, height: 14, text: "TAG 2" }),
        newElement("text", "card-2-title", { x: 230, y: 140, width: 150, height: 24, text: "Servicio 2" }),
      ],
    };

    const cards = getContainerCards(flatComp);
    expect(cards).toHaveLength(2);
    expect(cards[0].id).toBe("card-1");
    expect(cards[0].elementCount).toBe(3); // rect + tag + title
    expect(cards[1].id).toBe("card-2");
    expect(cards[1].elementCount).toBe(3);

    // findRootCardId debe encontrar card-1 a partir de card-1-title
    expect(findRootCardId(flatComp.elements, "card-1-title")).toBe("card-1");
  });

  it("salta a la siguiente fila al duplicar cuando la fila actual está llena (ej. más de 5 tarjetas)", () => {
    // 5 tarjetas de 180px con 20px de separación en un lienzo de 1024px:
    // x: 20, 220, 420, 620, 820 -> la 5ta llega a 820+180 = 1000px.
    const fiveCardsComp: ComponentDef = {
      id: "five-cards",
      name: "5 Tarjetas en fila",
      description: "Fila de 5 tarjetas completas",
      category: "sections",
      width: 1024,
      height: 320,
      custom: true,
      links: {},
      elements: [
        newElement("rect", "c1", { x: 20, y: 100, width: 180, height: 180 }),
        newElement("text", "c1-t", { parentId: "c1", text: "T1", x: 30, y: 120, width: 150, height: 20 }),
        newElement("rect", "c2", { x: 220, y: 100, width: 180, height: 180 }),
        newElement("text", "c2-t", { parentId: "c2", text: "T2", x: 230, y: 120, width: 150, height: 20 }),
        newElement("rect", "c3", { x: 420, y: 100, width: 180, height: 180 }),
        newElement("text", "c3-t", { parentId: "c3", text: "T3", x: 430, y: 120, width: 150, height: 20 }),
        newElement("rect", "c4", { x: 620, y: 100, width: 180, height: 180 }),
        newElement("text", "c4-t", { parentId: "c4", text: "T4", x: 630, y: 120, width: 150, height: 20 }),
        newElement("rect", "c5", { x: 820, y: 100, width: 180, height: 180 }),
        newElement("text", "c5-t", { parentId: "c5", text: "T5", x: 830, y: 120, width: 150, height: 20 }),
      ],
    };

    // Duplicar la 5ta tarjeta para obtener la 6ta tarjeta
    const { component: updated, newCardId } = duplicateCardInComponent(fiveCardsComp, "c5");
    const cards = getContainerCards(updated);
    expect(cards).toHaveLength(6);

    const sixthCard = updated.elements.find((e) => e.id === newCardId)!;
    // Como 820 + 180 + 20 + 180 = 1200 > 1024, debe saltar a la fila 2 alineado a la izquierda (x: 20)
    expect(sixthCard.x).toBe(20);
    expect(sixthCard.y).toBe(300); // 100 + 180 + 20
    // La altura del componente debe haberse expandido automáticamente
    expect(updated.height).toBeGreaterThanOrEqual(300 + 180 + 24);

    // Y los hijos de la 6ta tarjeta deben tener coordenadas congruentes y parentId
    const sixthChild = updated.elements.find((e) => e.parentId === newCardId)!;
    expect(sixthChild).toBeDefined();
    expect(sixthChild.x).toBe(30);
    expect(sixthChild.y).toBe(320);

    // Al eliminar la 6ta tarjeta (fila 2), la altura del bloque debe adaptarse y reducirse de nuevo
    const shrunk = deleteCardFromComponent(updated, newCardId);
    expect(getContainerCards(shrunk)).toHaveLength(5);
    expect(shrunk.height).toBeLessThan(updated.height);
    expect(shrunk.height).toBe(100 + 180 + 24); // Máximo elemento en y:100 + h:180 + 24
  });

  it("al agregar una nueva tarjeta genera color individual nuevo y título limpio propio", () => {
    const comp = makeTestComponent(); // Tiene 2 tarjetas
    const { component: updated, newCardId } = addCardToComponent(comp, "Trámite de Licencias");
    const newRoot = updated.elements.find((e) => e.id === newCardId)!;
    // La nueva tarjeta debe tener un color individual propio (no idéntico por duplicado ciego)
    expect(newRoot.fill).toBeDefined();
    expect(newRoot.fill).not.toBe("transparent");

    // Y el título debe ser el nuevo, no el de la tarjeta anterior
    const newTitle = updated.elements.find((e) => e.parentId === newCardId && (e.role === "heading" || e.kind === "text"))!;
    expect(newTitle.text).toBe("Trámite de Licencias");
  });

  it("obtiene tarjetas con su color de relleno fill para gestión de tarjetas", () => {
    const comp = makeTestComponent();
    const cards = getContainerCards(comp);
    expect(cards).toHaveLength(2);
    expect(cards[0].fill).toBe("#cbd5e1");
    expect(cards[1].fill).toBe("#cbd5e1");
  });

  it("crea el hero municipal de búsqueda con disparador de buscador modal", () => {
    const hero = createMunicipalSearchHero("hero-buscador");
    expect(hero.id).toBe("hero-buscador");
    expect(hero.name).toContain("Buscador Hero");
    expect(hero.elements.length).toBeGreaterThan(5);
    const searchTrigger = hero.elements.find(
      (e) => e.role === "button" && e.control?.name === "search-trigger"
    );
    expect(searchTrigger).toBeDefined();
    expect(searchTrigger?.text).toBe("Buscar trámites");
  });

  it("crea la lista de trámites y servicios en tarjetas organizadas", () => {
    const list = createMunicipalSearchList("lista-buscador");
    expect(list.id).toBe("lista-buscador");
    expect(list.category).toBe("cards");
    expect(list.elements.length).toBeGreaterThan(10);
    const cards = getContainerCards(list);
    expect(cards.length).toBe(6);
    expect(cards[0].title).toContain("Ventanilla Única");
  });

  it("crea la sección de decretos con seleccionables, minibuscador, fecha y dos cards", () => {
    const def = createTramitesLeyesDecretos("decretos");
    const options = def.elements.find((e) => e.control?.name === "opcion");
    const search = def.elements.find((e) => e.control?.name === "search-query");
    const date = def.elements.find((e) => e.control?.name === "fecha");

    expect(options?.control?.inputType).toBe("radio");
    expect(options?.control?.options).toEqual(["Decretos", "Leyes", "Normativas"]);
    expect(search?.control?.inputType).toBe("search");
    expect(date?.control?.options).toContain("2020-09-29");

    const css = def.styles?.[SECTION_KEY]?.css ?? "";
    expect(css).toContain('value="Leyes"');
    expect(css).toContain('value="Normativas"');
    expect(def.elements.some((e) => e.text === "Título")).toBe(true);
    expect(def.elements.some((e) => e.text === "Decretos")).toBe(true);
    expect(def.elements.some((e) => e.text === "Leyes")).toBe(true);
    expect(def.elements.some((e) => e.text === "Normativas")).toBe(true);
    expect(def.elements.some((e) => e.text === "Información")).toBe(true);
    expect(def.elements.some((e) => e.text === "Fecha")).toBe(true);
    expect(def.elements.some((e) => e.text === "Abrir PDF")).toBe(true);

    const pdfButtons = def.elements.filter((e) => e.text === "Abrir PDF");
    expect(pdfButtons.length).toBeGreaterThan(0);
    expect(pdfButtons.every((b) => b.control?.name === "abrir-pdf")).toBe(true);
    expect(pdfButtons.some((b) => b.control?.name === "search-trigger")).toBe(false);
  });

  describe("gestión de tarjetas por opción seleccionable", () => {
    it("detecta opciones configuradas en el componente", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const opts = getComponentOptions(def);
      expect(opts.length).toBe(3);
      expect(opts[0]).toEqual({ key: "opt1", index: 0, label: "Decretos" });
      expect(opts[1]).toEqual({ key: "opt2", index: 1, label: "Leyes" });
      expect(opts[2]).toEqual({ key: "opt3", index: 2, label: "Normativas" });
    });

    it("filtra tarjetas que pertenecen a cada opción", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const cardsOpt1 = getCardsForOption(def, "opt1");
      const cardsOpt2 = getCardsForOption(def, "opt2");
      const cardsOpt3 = getCardsForOption(def, "opt3");

      expect(cardsOpt1.length).toBe(3);
      expect(cardsOpt2.length).toBe(3);
      expect(cardsOpt3.length).toBe(3);

      expect(cardsOpt1[0].title).toBe("Título");
      expect(cardsOpt2[0].title).toBe("Título");
      expect(cardsOpt3[0].title).toBe("Título");

      // En PC: fila de tres cards
      const c1 = def.elements.find((e) => e.id.endsWith("opt1-c1-card"))!;
      const c2 = def.elements.find((e) => e.id.endsWith("opt1-c2-card"))!;
      const c3 = def.elements.find((e) => e.id.endsWith("opt1-c3-card"))!;
      expect(c1.y).toBe(c2.y);
      expect(c2.y).toBe(c3.y);
      expect(c1.x).toBe(40);
      expect(c2.x).toBe(360);
      expect(c3.x).toBe(680);
    });

    it("agrega una nueva tarjeta a una opción específica sin alterar las otras", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const { component: updated, newCardId } = addCardToOption(def, "opt2", "Nueva Ley de Tránsito");

      const cardsOpt1 = getCardsForOption(updated, "opt1");
      const cardsOpt2 = getCardsForOption(updated, "opt2");

      expect(cardsOpt1.length).toBe(3);
      expect(cardsOpt2.length).toBe(4);
      expect(cardsOpt2.some((c) => c.id === newCardId)).toBe(true);
      expect(updated.elements.some((e) => e.text === "Nueva Ley de Tránsito")).toBe(true);

      const kindEl = updated.elements.find((e) => e.id === newCardId.replace(/-card$/, "-kind"));
      expect(kindEl?.text).toBe("Leyes");
      const btnEl = updated.elements.find((e) => e.id === newCardId.replace(/-card$/, "-btn"));
      expect(btnEl?.control?.name).toBe("abrir-pdf");
    });

    it("duplica una tarjeta dentro de la misma opción", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const cardsOpt1 = getCardsForOption(def, "opt1");
      const targetCardId = cardsOpt1[0].id;

      const { component: updated, newCardId } = duplicateCardInOption(def, targetCardId);
      const newOpt1Cards = getCardsForOption(updated, "opt1");

      expect(newOpt1Cards.length).toBe(4);
      expect(newOpt1Cards.some((c) => c.id === newCardId)).toBe(true);
      expect(newCardId).not.toBe(targetCardId);

      const kindEl = updated.elements.find((e) => e.id === newCardId.replace(/-card$/, "-kind"));
      expect(kindEl?.text).toBe("Decretos");
    });

    it("elimina una tarjeta de una opción y reordena posiciones", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const cardsOpt1 = getCardsForOption(def, "opt1");
      const firstCardId = cardsOpt1[0].id;

      const updated = deleteCardFromOption(def, firstCardId);
      const remainingCards = getCardsForOption(updated, "opt1");

      expect(remainingCards.length).toBe(2);
      expect(remainingCards.some((c) => c.id === firstCardId)).toBe(false);
      expect(updated.elements.some((e) => e.id === firstCardId)).toBe(false);
    });

    it("mueve una tarjeta de una opción a otra sin repetir ids aunque el destino ya tenga ese tag", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const cardToMove = getCardsForOption(def, "opt1")[0].id;
      const idsDestino = new Set(getCardsForOption(def, "opt3").map((c) => c.id));
      expect(idsDestino.has("decretos-opt3-c1-card")).toBe(true);

      const { component: updated, newCardId } = moveCardToOption(def, cardToMove, "opt3");
      const cardsOpt1After = getCardsForOption(updated, "opt1");
      const cardsOpt3After = getCardsForOption(updated, "opt3");
      const ids = updated.elements.map((e) => e.id);

      expect(cardsOpt1After.length).toBe(2);
      expect(cardsOpt3After.length).toBe(4);
      expect(cardsOpt3After.some((c) => c.id === newCardId)).toBe(true);
      expect(idsDestino.has(newCardId)).toBe(false);
      expect(new Set(ids).size).toBe(ids.length);

      const movedKindEl = updated.elements.find((e) => e.id === newCardId.replace(/-card$/, "-kind"));
      expect(movedKindEl?.text).toBe("Normativas");
      const movedBtnEl = updated.elements.find((e) => e.id === newCardId.replace(/-card$/, "-btn"));
      expect(movedBtnEl?.control?.name).toBe("abrir-pdf");
    });

    it("mantiene ids únicos al agregar y duplicar tarjetas seguidas", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const added = addCardToOption(def, "opt2").component;
      const duplicated = duplicateCardInOption(added, getCardsForOption(added, "opt2")[0].id).component;
      const ids = duplicated.elements.map((e) => e.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it("actualiza el label de una opción y sincroniza los radios", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const updated = updateOptionLabel(def, 1, "Leyes y Normativas");
      const radio = updated.elements.find((e) => e.control?.name === "opcion");

      expect(radio?.control?.options?.[1]).toBe("Leyes y Normativas");
      expect(radio?.control?.options?.[0]).toBe("Decretos");
      expect(radio?.control?.options?.[2]).toBe("Normativas");

      const opt2Cards = getCardsForOption(updated, "opt2");
      for (const card of opt2Cards) {
        const kindEl = updated.elements.find((e) => e.id === card.id.replace(/-card$/, "-kind"));
        expect(kindEl?.text).toBe("Leyes y Normativas");
      }
    });

    it("se adapta a responsive mobile (360px) con fila de 2 cards por fila", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const mobileDef = stackLayout(def, 360);

      expect(mobileDef.width).toBe(360);
      for (const el of mobileDef.elements) {
        if (!el.hidden) {
          expect(el.x).toBeGreaterThanOrEqual(0);
          expect(el.x + el.width).toBeLessThanOrEqual(361);
        }
      }
      const cardRoot = mobileDef.elements.find((e: any) => e.id.endsWith("opt1-c1-card"));
      const card2Root = mobileDef.elements.find((e: any) => e.id.endsWith("opt1-c2-card"));
      const card3Root = mobileDef.elements.find((e: any) => e.id.endsWith("opt1-c3-card"));
      expect(cardRoot).toBeDefined();
      expect(card2Root).toBeDefined();
      expect(card3Root).toBeDefined();
      if (!cardRoot || !card2Root || !card3Root) throw new Error("cardRoot not found");

      // 2 cards en la primera fila: comparten Y y c2 está a la derecha de c1
      expect(cardRoot.y).toBe(card2Root.y);
      expect(card2Root.x).toBeGreaterThan(cardRoot.x);
      // La 3ra card salta a la siguiente fila:
      expect(card3Root.y).toBeGreaterThan(cardRoot.y);
      expect(card3Root.x).toBe(cardRoot.x);

      // Los elementos hijos deben tener parentId en la definición original (exactamente 5: Categoría, Título, Info, Fecha, Botón)
      const origChildren = def.elements.filter((e: any) => e.parentId === cardRoot.id);
      expect(origChildren.length).toBe(5);

      // Y en mobileDef sus coordenadas deben estar estrictamente dentro de la card
      const mobileChildren = mobileDef.elements.filter((e: any) => e.id.includes("opt1-c1") && e.id !== cardRoot.id);
      expect(mobileChildren.length).toBe(5);

      // Sin emojis en ningún elemento
      for (const el of def.elements) {
        expect(el.text).not.toContain("📅");
        expect(el.text).not.toContain("→");
      }

      for (const child of mobileChildren) {
        expect(child.x).toBeGreaterThanOrEqual(cardRoot.x);
        expect(child.x + child.width).toBeLessThanOrEqual(cardRoot.x + cardRoot.width + 1);
        expect(child.y).toBeGreaterThanOrEqual(cardRoot.y);
        expect(child.y + child.height).toBeLessThanOrEqual(cardRoot.y + cardRoot.height + 1);
      }
    });

    it("se adapta a responsive tablet (768px) con fila de 2 cards por fila", () => {
      const def = createTramitesLeyesDecretos("decretos");
      const tabletDef = stackLayout(def, 768);

      expect(tabletDef.width).toBe(768);
      for (const el of tabletDef.elements) {
        if (!el.hidden) {
          expect(el.x).toBeGreaterThanOrEqual(0);
          expect(el.x + el.width).toBeLessThanOrEqual(769);
        }
      }

      const c1 = tabletDef.elements.find((e: any) => e.id.endsWith("opt1-c1-card"))!;
      const c2 = tabletDef.elements.find((e: any) => e.id.endsWith("opt1-c2-card"))!;
      const c3 = tabletDef.elements.find((e: any) => e.id.endsWith("opt1-c3-card"))!;

      // 2 cards en la primera fila en tablet:
      expect(c1.y).toBe(c2.y);
      expect(c2.x).toBeGreaterThan(c1.x);
      // La 3ra card en la siguiente fila:
      expect(c3.y).toBeGreaterThan(c1.y);
      expect(c3.x).toBe(c1.x);
    });
  });
});



