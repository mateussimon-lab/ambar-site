(function () {
  "use strict";

  // Todo o texto e as fotos do site vivem em /content/*.json.
  // Quem edita é o CMS (pasta /admin); este arquivo só lê e desenha as páginas.
  const CONTENT_FILES = {
    geral: "content/geral.json",
    home: "content/home.json",
    sobre: "content/sobre.json",
    arquitetura: "content/arquitetura.json",
    planejamento: "content/planejamento.json",
    gestao: "content/gestao.json",
    contato: "content/contato.json",
    tema: "content/tema.json",
    projetos: "content/projetos.json"
  };

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function fetchJson(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`Não foi possível carregar ${path}.`, error);
      return null;
    }
  }

  function normalizeProjects(list) {
    const used = new Set();
    return (Array.isArray(list) ? list : [])
      .filter((item) => item && item.title)
      .map((item) => {
        // Projetos antigos já têm "id"; projetos novos ganham um a partir do nome.
        let id = item.id || slugify(item.title) || "projeto";
        while (used.has(id)) id += "-2";
        used.add(id);
        const images = (Array.isArray(item.images) ? item.images : []).filter(Boolean);
        return {
          id,
          title: item.title,
          category: item.category || "",
          location: item.location || "",
          year: item.year || "",
          lotArea: item.lotArea || "",
          builtArea: item.builtArea || "",
          projectYear: item.projectYear || "",
          completionYear: item.completionYear || "",
          builder: item.builder || "",
          photography: item.photography || "",
          cover: item.cover || images[0] || "",
          summary: item.summary || "",
          description: item.description || "",
          images
        };
      });
  }

  async function loadContent() {
    const keys = Object.keys(CONTENT_FILES);
    const loaded = await Promise.all(keys.map((key) => fetchJson(CONTENT_FILES[key])));
    if (loaded.every((item) => item === null)) {
      throw new Error("Nenhum arquivo de conteúdo pôde ser carregado.");
    }
    const data = Object.fromEntries(keys.map((key, index) => [key, loaded[index] || {}]));

    const heroImages = (data.home.heroImages || []).filter(Boolean);
    const arq = data.arquitetura;

    return {
      site: {
        brand: data.geral.brand || "",
        descriptor: data.geral.descriptor || "",
        email: data.contato.email || "",
        address: data.contato.address || "",
        mapQuery: data.contato.mapQuery || data.contato.address || "",
        instagram: data.contato.instagram || "",
        instagramLabel: data.contato.instagramLabel || "",
        heroImages,
        heroImage: heroImages[0] || ""
      },
      home: {},
      about: {
        intro: data.sobre.intro || "",
        teamIntro: data.sobre.teamIntro || "",
        team: Array.isArray(data.sobre.team) ? data.sobre.team : [],
        teamOutro: data.sobre.teamOutro || ""
      },
      architecture: {
        lead: arq.lead || "",
        categories: {
          "Casas": arq.casas || "",
          "Edifícios": arq.edificios || "",
          "Outros": arq.outros || ""
        }
      },
      planning: {
        lead: data.planejamento.lead || "",
        sections: Array.isArray(data.planejamento.sections) ? data.planejamento.sections : []
      },
      management: { lead: data.gestao.lead || "" },
      theme: data.tema,
      projects: normalizeProjects(data.projetos.projetos)
    };
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text !== undefined) {
      element.textContent = text;
    }
    return element;
  }

  function setText(selector, value, root) {
    const element = $(selector, root);
    if (element) {
      element.textContent = value || "";
    }
  }

  function setImage(selector, src, alt, root) {
    const image = $(selector, root);
    if (image) {
      image.src = src || "";
      image.alt = alt || "";
    }
  }

  function renderTextBlock(selector, value, root) {
    const element = $(selector, root);
    if (!element) return;
    const paragraphs = Array.isArray(value)
      ? value
      : String(value || "")
          .split(/\n+/)
          .map((text) => text.trim());
    element.replaceChildren(
      ...paragraphs
        .filter(Boolean)
        .map((text) => el("p", "", text))
    );
  }

  // Todas as páginas ficam na raiz do site, então os caminhos valem como estão.
  function imagePath(path) {
    return path || "";
  }

  function routePath(path) {
    return path;
  }

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function fontStack(value) {
    const fonts = {
      calibri: 'Calibri, "Helvetica Neue", Arial, sans-serif',
      arial: 'Arial, "Helvetica Neue", sans-serif',
      helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      inter: 'Inter, Calibri, "Helvetica Neue", Arial, sans-serif',
      garamond: '"Cormorant Garamond", Georgia, serif',
      georgia: 'Georgia, "Times New Roman", serif'
    };
    return fonts[value] || value || fonts.calibri;
  }

  function rem(value, fallback) {
    const number = Number.parseFloat(value);
    return `${Number.isFinite(number) ? number : fallback}rem`;
  }

  function px(value, fallback) {
    const number = Number.parseFloat(value);
    return `${Number.isFinite(number) ? number : fallback}px`;
  }

  function applyTheme(theme = {}) {
    const root = document.documentElement;
    root.style.setProperty("--ambar-font-body", fontStack(theme.bodyFont));
    root.style.setProperty("--ambar-font-heading", fontStack(theme.headingFont));
    root.style.setProperty("--ambar-font-menu", fontStack(theme.menuFont));
    root.style.setProperty("--ambar-size-body", px(theme.bodySize, 16));
    root.style.setProperty("--ambar-size-menu", rem(theme.menuSize, 0.82));
    root.style.setProperty("--ambar-size-submenu", rem(theme.submenuSize, 0.72));
    root.style.setProperty("--ambar-size-label", rem(theme.labelSize, 0.76));
    root.style.setProperty("--ambar-size-hero-title", rem(theme.heroTitleSize, 4.7));
    root.style.setProperty("--ambar-size-page-title", rem(theme.pageTitleSize, 4.35));
    root.style.setProperty("--ambar-size-section-title", rem(theme.sectionTitleSize, 3.25));
    root.style.setProperty("--ambar-size-lead", rem(theme.leadSize, 1.08));
    root.style.setProperty("--ambar-size-card-title", rem(theme.cardTitleSize, 1.45));
  }

  function renderGlobal(content) {
    applyTheme(content.theme);

    $$("[data-brand]").forEach((node) => {
      node.textContent = content.site.brand;
    });
    $$("[data-descriptor]").forEach((node) => {
      node.textContent = content.site.descriptor;
    });
    $$("[data-instagram]").forEach((node) => {
      node.href = content.site.instagram;
      node.classList.add("instagram-link");
      node.setAttribute("aria-label", `Instagram ${content.site.instagramLabel}`);
      const icon = el("span", "instagram-icon");
      icon.setAttribute("aria-hidden", "true");
      node.replaceChildren(icon, document.createTextNode(content.site.instagramLabel));
    });
    $$("[data-address]").forEach((node) => {
      node.textContent = content.site.address;
    });
    $$("[data-email]").forEach((node) => {
      node.textContent = content.site.email;
      node.href = `mailto:${content.site.email}`;
    });

    $$("[data-architecture-submenu]").forEach((menu) => {
      const categories = Object.keys(content.architecture?.categories || {});
      menu.replaceChildren(
        ...categories.map((category) => {
          const link = el("a", "nav-submenu__link", category);
          link.href = routePath(`projetos.html?categoria=${encodeURIComponent(category)}`);
          return link;
        })
      );
    });

    $$("[data-planning-submenu]").forEach((menu) => {
      const sections = Array.isArray(content.planning?.sections) ? content.planning.sections : [];
      menu.replaceChildren(
        ...sections.map((section) => {
          const link = el("a", "nav-submenu__link", section.title);
          link.href = routePath(`planejamento.html?secao=${encodeURIComponent(section.title)}`);
          return link;
        })
      );
    });

    const page = document.body.dataset.page || "";
    $$(".site-nav a").forEach((link) => {
      const target = link.dataset.nav;
      link.classList.toggle("is-active", target === page || (page === "project" && target === "projects"));
    });

    const toggle = $(".nav-toggle");
    const nav = $(".site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const next = !nav.classList.contains("is-open");
        nav.classList.toggle("is-open", next);
        toggle.classList.toggle("is-open", next);
        document.body.classList.toggle("is-locked", next);
        toggle.setAttribute("aria-expanded", String(next));
      });
    }
  }

  function projectUrl(project) {
    return `projeto.html?id=${encodeURIComponent(project.id)}`;
  }

  function renderProjectCard(project, index) {
    const article = el("article", "project-card");
    article.dataset.category = project.category;

    const media = el("a", "project-card__media");
    media.href = projectUrl(project);

    const image = el("img");
    image.src = imagePath(project.cover);
    image.alt = project.title;
    image.loading = index > 1 ? "lazy" : "eager";
    media.appendChild(image);

    const body = el("div", "project-card__body");
    const top = el("div");
    top.appendChild(el("p", "project-meta", `${project.category} / ${project.location}`));
    top.appendChild(el("h3", "", project.title));
    top.appendChild(el("p", "", project.summary));

    const link = el("a", "text-link", "Ver projeto");
    link.href = projectUrl(project);
    body.append(top, link);
    article.append(media, body);
    return article;
  }

  function renderHome(content) {
    const heroStage = $("[data-hero-carousel]");
    const heroDots = $("[data-hero-dots]");
    const heroImages = (Array.isArray(content.site.heroImages) && content.site.heroImages.length
      ? content.site.heroImages
      : [content.site.heroImage]
    ).filter(Boolean);

    if (heroStage && heroImages.length) {
      let current = 0;
      const slides = heroImages.map((src, index) => {
        const image = el("img", `hero__slide${index === 0 ? " is-active" : ""}`);
        image.src = imagePath(src);
        image.alt = `${content.site.brand} ${content.site.descriptor} — imagem ${index + 1}`.trim();
        image.loading = index === 0 ? "eager" : "lazy";
        return image;
      });

      function activate(index) {
        current = index;
        slides.forEach((slide, slideIndex) => {
          slide.classList.toggle("is-active", slideIndex === current);
        });
        if (heroDots) {
          $$(".hero__dot", heroDots).forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === current);
          });
        }
      }

      heroStage.replaceChildren(...slides);
      if (heroDots) {
        heroDots.replaceChildren(
          ...heroImages.map((_, index) => {
            const button = el("button", `hero__dot${index === 0 ? " is-active" : ""}`);
            button.type = "button";
            button.setAttribute("aria-label", `Imagem de capa ${index + 1}`);
            button.addEventListener("click", () => activate(index));
            return button;
          })
        );
      }

      if (heroImages.length > 1) {
        window.setInterval(() => activate((current + 1) % heroImages.length), 5200);
      }
    }

    const map = $("[data-map]");
    if (map) {
      map.src = mapUrl(content.site.mapQuery);
    }
  }

  // Aceita um endereço em texto OU coordenadas ("-29.1668,-51.5214"). Coordenadas são o jeito mais preciso.
  function mapUrl(query) {
    return `https://www.google.com/maps?q=${encodeURIComponent(query || "")}&z=17&output=embed`;
  }

  function renderAbout(content) {
    const intro = $("[data-about-intro]");
    if (intro) {
      intro.replaceChildren(
        ...String(content.about.intro || "")
          .split(/\n+/)
          .map((text) => text.trim())
          .filter(Boolean)
          .map((text) => el("p", "section-copy", text))
      );
    }

    const team = $("[data-team]");
    setText("[data-team-intro]", content.about.teamIntro);
    setText("[data-team-outro]", content.about.teamOutro);
    if (team) {
      team.replaceChildren(
        ...(content.about.team || []).map((person, index) => {
          const card = el("article", "team-card");
          const media = el("div", "team-card__media");
          if (person.photo) {
            const image = el("img");
            image.src = imagePath(person.photo);
            image.alt = person.name;
            image.loading = index > 1 ? "lazy" : "eager";
            media.appendChild(image);
          } else {
            media.appendChild(el("span", "", "Foto"));
          }
          const body = el("div", "team-card__body");
          body.append(
            el("h3", "", person.name),
            el("strong", "", person.role),
            el("p", "", person.qualifications)
          );
          card.append(media, body);
          return card;
        })
      );
    }
  }

  function renderProjects(content) {
    const grid = $("[data-project-grid]");
    const filters = $("[data-filters]");
    const empty = $("[data-empty-projects]");
    const categoryIntro = $("[data-category-intro]");

    setText("[data-architecture-title]", content.architecture?.title || "Arquitetura.");
    setText("[data-architecture-lead]", content.architecture?.lead || "");
    const categories = Object.keys(content.architecture?.categories || { Casas: "", "Edifícios": "", "Outros": "" });
    const requestedCategory = new URLSearchParams(window.location.search).get("categoria");
    const initialCategory = categories.find((category) => normalizeKey(category) === normalizeKey(requestedCategory)) || "";

    function paint(category) {
      const projects = category
        ? content.projects.filter((project) => normalizeKey(project.category) === normalizeKey(category))
        : content.projects;
      if (categoryIntro) {
        categoryIntro.textContent = category ? content.architecture?.categories?.[category] || "" : content.architecture?.overviewText || "";
      }
      if (grid) {
        grid.replaceChildren(...projects.map(renderProjectCard));
      }
      if (empty) {
        empty.classList.toggle("hidden", projects.length > 0);
        empty.textContent = category ? `Nenhum projeto cadastrado em ${category}.` : "Nenhum projeto cadastrado.";
      }
    }

    if (filters) {
      filters.replaceChildren(
        ...categories.map((category) => {
          const button = el("button", `filter-button${category === initialCategory ? " is-active" : ""}`, category);
          button.type = "button";
          button.addEventListener("click", () => {
            const isActive = button.classList.contains("is-active");
            $$(".filter-button", filters).forEach((item) => item.classList.remove("is-active"));
            if (isActive) {
              paint();
            } else {
              button.classList.add("is-active");
              paint(category);
            }
          });
          return button;
        })
      );
    }

    paint(initialCategory);
  }

  function renderPlanning(content) {
    const planning = content.planning || {};
    const sections = Array.isArray(planning.sections) ? planning.sections : [];
    const filters = $("[data-planning-filters]");
    const grid = $("[data-planning-grid]");
    const requestedSection = new URLSearchParams(window.location.search).get("secao");
    const initialSection = sections.find((section) => normalizeKey(section.title) === normalizeKey(requestedSection))?.title || "";

    setText("[data-planning-title]", planning.title || "Planejamento.");
    setText("[data-planning-lead]", planning.lead || "");

    function paint(activeTitle) {
      const visibleSections = activeTitle ? sections.filter((section) => section.title === activeTitle) : sections;
      if (grid) {
        grid.replaceChildren(
          ...visibleSections.map((section) => {
            const card = el("article", "planning-card");
            card.append(
              el("span", "planning-card__eyebrow", "Planejamento"),
              el("h2", "", section.title),
              el("p", "planning-card__lead", section.lead),
              el("p", "", section.text)
            );
            return card;
          })
        );
      }
    }

    if (filters) {
      filters.replaceChildren(
        ...sections.map((section) => {
          const button = el("button", `filter-button${section.title === initialSection ? " is-active" : ""}`, section.title);
          button.type = "button";
          button.addEventListener("click", () => {
            const isActive = button.classList.contains("is-active");
            $$(".filter-button", filters).forEach((item) => item.classList.remove("is-active"));
            if (isActive) {
              paint();
            } else {
              button.classList.add("is-active");
              paint(section.title);
            }
          });
          return button;
        })
      );
    }

    paint(initialSection);
  }

  function renderProject(content) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || content.projects[0]?.id;
    const project = content.projects.find((item) => item.id === id) || content.projects[0];

    if (!project) {
      setText("[data-project-title]", "Projeto não encontrado");
      return;
    }

    document.title = `${project.title} | Âmbar Arquitetura`;
    setText("[data-project-title]", project.title);
    setText("[data-project-meta]", `${project.category} / ${project.location} / ${project.year}`);
    renderTextBlock("[data-project-description]", project.description);

    const technical = $("[data-technical-list]");
    if (technical) {
      const rows = [
        ["Categoria", project.category],
        ["Local", project.location],
        ["Área do terreno", project.lotArea],
        ["Área construída", project.builtArea || project.area],
        ["Ano projeto", project.projectYear],
        ["Conclusão obra", project.completionYear || project.year],
        ["Construtora", project.builder],
        ["Fotografia", project.photography]
      ].filter(([label, value]) => value || !["Construtora"].includes(label));

      technical.replaceChildren(
        ...rows.map(([label, value]) => {
          const wrapper = el("div");
          wrapper.append(el("dt", "", label), el("dd", "", value || "—"));
          return wrapper;
        })
      );
    }

    const images = project.images && project.images.length ? project.images : [project.cover];
    const stage = $("[data-carousel-stage]");
    const dots = $("[data-carousel-dots]");
    const counter = $("[data-carousel-counter]");
    const previous = $("[data-carousel-prev]");
    const next = $("[data-carousel-next]");
    let current = 0;

    function updateCarousel() {
      const image = el("img");
      image.src = imagePath(images[current]);
      image.alt = `${project.title} — imagem ${current + 1}`;
      if (stage) {
        stage.replaceChildren(image);
      }
      if (counter) {
        counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;
      }
      if (dots) {
        dots.replaceChildren(
          ...images.map((_, index) => {
            const button = el("button", index === current ? "is-active" : "");
            button.type = "button";
            button.setAttribute("aria-label", `Imagem ${index + 1}`);
            button.addEventListener("click", () => {
              current = index;
              updateCarousel();
            });
            return button;
          })
        );
      }
    }

    if (previous) {
      previous.addEventListener("click", () => {
        current = (current - 1 + images.length) % images.length;
        updateCarousel();
      });
    }
    if (next) {
      next.addEventListener("click", () => {
        current = (current + 1) % images.length;
        updateCarousel();
      });
    }

    const stack = $("[data-image-stack]");
    if (stack) {
      stack.replaceChildren(
        ...images.map((src, index) => {
          const image = el("img");
          image.src = imagePath(src);
          image.alt = `${project.title} — imagem ${index + 1}`;
          image.loading = index > 1 ? "lazy" : "eager";
          return image;
        })
      );
    }

    updateCarousel();
  }

  function renderContact(content) {
    setText("[data-contact-title]", content.site.contactCta);
    const map = $("[data-map]");
    if (map) {
      map.src = mapUrl(content.site.mapQuery);
    }

    const form = $("[data-contact-form]");
    const message = $("[data-form-message]");
    if (form) {
      const button = form.querySelector('button[type="submit"]');
      const say = (text, isError) => {
        if (!message) return;
        message.textContent = text;
        message.style.color = isError ? "#9b2c2c" : "";
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        if (data.get("bot-field")) return; // campo-isca preenchido: é robô, ignora em silêncio

        if (button) button.disabled = true;
        say("Enviando...", false);
        try {
          const response = await fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(data).toString()
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          form.reset();
          say("Mensagem enviada. Obrigado pelo contato, responderemos em breve.", false);
        } catch (error) {
          say(`Não foi possível enviar agora. Escreva para ${content.site.email || "o nosso e-mail"} e responderemos.`, true);
        } finally {
          if (button) button.disabled = false;
        }
      });
    }
  }

  function renderManagement(content) {
    setText("[data-management-title]", content.management?.title || "Gestão Técnica.");
    setText("[data-management-lead]", content.management?.lead || "");
    setText("[data-management-text]", content.management?.text || "");
  }

  function showLoadError() {
    const main = document.querySelector("main") || document.body;
    const notice = document.createElement("p");
    notice.className = "section-copy";
    notice.style.padding = "4rem 1.5rem";
    notice.textContent = "Não foi possível carregar o conteúdo desta página. Atualize a página ou tente novamente em instantes.";
    main.prepend(notice);
  }

  async function renderPage() {
    let content;
    try {
      content = await loadContent();
    } catch (error) {
      console.error(error);
      showLoadError();
      return;
    }

    renderGlobal(content);
    const page = document.body.dataset.page;
    if (page === "home") renderHome(content);
    if (page === "about") renderAbout(content);
    if (page === "projects") renderProjects(content);
    if (page === "planejamento") renderPlanning(content);
    if (page === "project") renderProject(content);
    if (page === "contact") renderContact(content);
    if (page === "management") renderManagement(content);
  }

  document.addEventListener("DOMContentLoaded", renderPage);
})();
