const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const revealItems = document.querySelectorAll(".reveal");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartOpenButtons = document.querySelectorAll("[data-cart-open]");
const cartClose = document.querySelector("[data-cart-close]");
const cartItems = document.querySelector("[data-cart-items]");
const cartCount = document.querySelector("[data-cart-count]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCheckout = document.querySelector("[data-cart-checkout]");

const whatsappNumber = "5531999760553";
const products = {
  "brinco-flor-dourada": {
    name: "Brinco Flor Dourada",
    category: "Brincos",
    price: 89.9,
    image: "assets/vitrine-brinco-flor-dourada.jpeg",
  },
  "brinco-coracao-dourado": {
    name: "Brinco Coração Dourado",
    category: "Brincos",
    price: 74.9,
    image: "assets/category-brincos-coracao.jpeg",
  },
  "anel-duplo-ponto-luz": {
    name: "Anel Duplo Ponto de Luz",
    category: "Anéis",
    price: 84.9,
    image: "assets/category-aneis-dourados.jpeg",
  },
  "conjunto-coracao-shine": {
    name: "Conjunto Coração Shine",
    category: "Conjuntos",
    price: 169.9,
    image: "assets/vitrine-conjunto-coracao-dourado.jpeg",
  },
  "colar-coracao-prata": {
    name: "Colar Coração Prata",
    category: "Colares",
    price: 99.9,
    image: "assets/category-colares-coracao.jpeg",
  },
  "pulseira-borboleta-prata": {
    name: "Pulseira Borboleta Prata",
    category: "Pulseiras",
    price: 69.9,
    image: "assets/category-pulseiras-borboleta.jpeg",
  },
  "anel-coracao-cravejado": {
    name: "Anel Coração Cravejado",
    category: "Anéis",
    price: 79.9,
    image: "assets/vitrine-anel-coracao-cravejado.jpeg",
  },
  "conjunto-classico-dourado": {
    name: "Conjunto Clássico Dourado",
    category: "Conjuntos",
    price: 189.9,
    image: "assets/category-conjuntos-dourados.jpeg",
  },
  "colar-borboleta-rose": {
    name: "Colar Borboleta Rosé",
    category: "Peças delicadas",
    price: 94.9,
    image: "assets/category-pecas-delicadas-borboleta.jpeg",
  },
};

const cart = new Map();
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  });
});

const openCart = () => {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
};

const closeCart = () => {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
};

const getCartTotals = () => {
  let count = 0;
  let total = 0;
  cart.forEach((quantity, id) => {
    count += quantity;
    total += products[id].price * quantity;
  });
  return { count, total };
};

const buildWhatsappMessage = () => {
  const lines = ["Olá! Gostaria de fazer um pedido na Ilumine Semijoias:", ""];
  cart.forEach((quantity, id) => {
    const product = products[id];
    lines.push(`${quantity}x ${product.name} - ${money.format(product.price)} cada`);
  });
  lines.push("");
  lines.push(`Total estimado: ${money.format(getCartTotals().total)}`);
  lines.push("");
  lines.push("Gostaria de confirmar disponibilidade, forma de pagamento e combinar a entrega.");
  return lines.join("\n");
};

const renderCart = () => {
  const { count, total } = getCartTotals();
  cartCount.textContent = String(count);
  cartTotal.textContent = money.format(total);

  if (count === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Seu carrinho ainda está vazio.</p>';
    cartCheckout.classList.add("is-disabled");
    cartCheckout.href = "#";
    return;
  }

  cartItems.innerHTML = Array.from(cart.entries())
    .map(([id, quantity]) => {
      const product = products[id];
      return `
        <article class="cart-line">
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <p>${product.category} • ${money.format(product.price)} cada</p>
            <div class="cart-line-actions">
              <div class="quantity-control" aria-label="Quantidade de ${product.name}">
                <button type="button" data-cart-decrease="${id}" aria-label="Diminuir quantidade">−</button>
                <span>${quantity}</span>
                <button type="button" data-cart-increase="${id}" aria-label="Aumentar quantidade">+</button>
              </div>
              <button class="cart-remove" type="button" data-cart-remove="${id}">Remover</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  cartCheckout.classList.remove("is-disabled");
  cartCheckout.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsappMessage())}`;
};

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.addToCart;
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    openCart();
  });
});

cartOpenButtons.forEach((button) => button.addEventListener("click", openCart));
cartClose.addEventListener("click", closeCart);
cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
});

cartItems.addEventListener("click", (event) => {
  const increase = event.target.closest("[data-cart-increase]");
  const decrease = event.target.closest("[data-cart-decrease]");
  const remove = event.target.closest("[data-cart-remove]");

  if (increase) {
    const id = increase.dataset.cartIncrease;
    cart.set(id, (cart.get(id) || 0) + 1);
  }

  if (decrease) {
    const id = decrease.dataset.cartDecrease;
    const nextQuantity = (cart.get(id) || 0) - 1;
    if (nextQuantity <= 0) cart.delete(id);
    else cart.set(id, nextQuantity);
  }

  if (remove) {
    cart.delete(remove.dataset.cartRemove);
  }

  renderCart();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => observer.observe(item));
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
renderCart();
