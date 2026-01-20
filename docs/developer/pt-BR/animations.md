# Sistema de Animações

Sistema completo de animações com Framer Motion para criar interfaces fluidas e engajadoras.

## Índice

- [Instalação](#instalação)
- [Variants](#variants)
- [Hooks](#hooks)
- [Componentes](#componentes)
- [Exemplos](#exemplos)
- [Boas Práticas](#boas-práticas)

## Instalação

O Framer Motion já está instalado no projeto:

```bash
npm install framer-motion
```

## Variants

Variants são objetos que definem estados de animação reutilizáveis.

### Fade Animations

```tsx
import { fadeIn, fadeInUp, fadeInDown } from '@/lib/animations';

<motion.div variants={fadeIn} initial="initial" animate="animate">
  Conteúdo com fade in
</motion.div>

<motion.div variants={fadeInUp}>
  Conteúdo que sobe com fade
</motion.div>
```

**Disponíveis:**
- `fadeIn` - Fade simples
- `fadeInUp` - Fade + movimento para cima
- `fadeInDown` - Fade + movimento para baixo
- `fadeInLeft` - Fade + movimento da esquerda
- `fadeInRight` - Fade + movimento da direita

### Scale Animations

```tsx
import { scaleIn, scaleBounce } from '@/lib/animations';

<motion.div variants={scaleIn}>
  Scale suave
</motion.div>

<motion.div variants={scaleBounce}>
  Scale com bounce
</motion.div>
```

**Disponíveis:**
- `scaleIn` - Scale básico
- `scaleUp` - Scale from 0.8
- `scaleDown` - Scale from 1.1
- `scaleBounce` - Scale com spring animation

### Page Transitions

```tsx
import { pageTransition, pageSlideTransition } from '@/lib/animations';

<motion.div
  variants={pageTransition}
  initial="initial"
  animate="animate"
  exit="exit"
>
  <YourPage />
</motion.div>
```

### Stagger Animations

```tsx
import { staggerContainer, staggerItem } from '@/lib/animations';

<motion.div variants={staggerContainer}>
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

## Hooks

Hooks customizados para padrões comuns de animação.

### useScrollAnimation

Anima elemento quando entra no viewport:

```tsx
import { useScrollAnimation } from '@/lib/animations';

function MyComponent() {
  const { ref, isInView } = useScrollAnimation({
    once: true,
    margin: '-100px',
    amount: 0.3,
  });

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
    >
      Conteúdo revelado no scroll
    </motion.div>
  );
}
```

**Opções:**
- `once?: boolean` - Anima apenas uma vez (padrão: true)
- `margin?: string` - Margem do IntersectionObserver (padrão: '-100px')
- `amount?: number | 'some' | 'all'` - Quanto precisa estar visível (padrão: 0.3)

### useScrollTrigger

Similar ao useScrollAnimation, mas retorna AnimationControls:

```tsx
import { useScrollTrigger, fadeInUp } from '@/lib/animations';

function MyComponent() {
  const [ref, controls] = useScrollTrigger({ once: true });

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={controls}
      variants={fadeInUp}
    >
      Conteúdo
    </motion.div>
  );
}
```

### useCountAnimation

Anima contagem de números:

```tsx
import { useCountAnimation } from '@/lib/animations';

function MetricCard() {
  const { ref, count } = useCountAnimation(1247, 2000);

  return (
    <div ref={ref}>
      <h2>{count}</h2>
    </div>
  );
}
```

### useReducedMotion

Detecta preferência de movimento reduzido do usuário:

```tsx
import { useReducedMotion } from '@/lib/animations';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.1 }}
    >
      Conteúdo
    </motion.div>
  );
}
```

### useAnimationVariants

Retorna variants respeitando preferência de motion:

```tsx
import { useAnimationVariants, fadeInUp } from '@/lib/animations';

function MyComponent() {
  const variants = useAnimationVariants(fadeInUp);

  return (
    <motion.div variants={variants}>
      Conteúdo
    </motion.div>
  );
}
```

## Componentes

Componentes pré-construídos com animações.

### FadeIn, FadeInUp, ScaleIn

Wrappers básicos de animação:

```tsx
import { FadeIn, FadeInUp, ScaleIn } from '@/lib/animations';

<FadeIn delay={0.2}>
  <Card>Conteúdo</Card>
</FadeIn>

<FadeInUp>
  <Title>Título animado</Title>
</FadeInUp>

<ScaleIn delay={0.5}>
  <Button>Botão</Button>
</ScaleIn>
```

### ScrollReveal

Revela conteúdo no scroll:

```tsx
import { ScrollReveal } from '@/lib/animations';

<ScrollReveal once={true} margin="-100px">
  <Section>
    Conteúdo revelado ao scrollar
  </Section>
</ScrollReveal>
```

### StaggerList e StaggerItem

Lista com animação escalonada:

```tsx
import { StaggerList, StaggerItem } from '@/lib/animations';

<StaggerList staggerDelay={0.1}>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.name}</Card>
    </StaggerItem>
  ))}
</StaggerList>
```

### PageTransition

Transição entre páginas:

```tsx
import { PageTransition } from '@/lib/animations';
import { AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  <PageTransition key={location.pathname}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </PageTransition>
</AnimatePresence>
```

### HoverScale e HoverLift

Efeitos de hover:

```tsx
import { HoverScale, HoverLift } from '@/lib/animations';

<HoverScale scale={1.05}>
  <Card>Hover para escalar</Card>
</HoverScale>

<HoverLift>
  <Card>Hover para levantar</Card>
</HoverLift>
```

### LoadingDots e LoadingSpinner

Indicadores de carregamento:

```tsx
import { LoadingDots, LoadingSpinner } from '@/lib/animations';

<LoadingDots className="text-primary" />

<LoadingSpinner className="w-8 h-8 text-primary" />
```

### CountUp

Animação de contagem:

```tsx
import { CountUp } from '@/lib/animations';

<CountUp
  value={1247}
  duration={2}
  prefix=""
  suffix=" usuários"
/>
```

### AnimatedProgress

Barra de progresso animada:

```tsx
import { AnimatedProgress } from '@/lib/animations';

<AnimatedProgress
  value={75}
  duration={0.5}
  className="h-2"
  barClassName="bg-green-500"
/>
```

### Collapse

Expande/colapsa conteúdo:

```tsx
import { Collapse } from '@/lib/animations';

<Collapse isOpen={isOpen}>
  <div className="p-4">
    Conteúdo colapsável
  </div>
</Collapse>
```

### Shimmer

Efeito shimmer para loading:

```tsx
import { Shimmer } from '@/lib/animations';

<div className="relative w-full h-20 bg-gray-200 rounded overflow-hidden">
  <Shimmer />
</div>
```

### Pulse, Floating, BounceIn, SlideIn

Efeitos especiais:

```tsx
import { Pulse, Floating, BounceIn, SlideIn } from '@/lib/animations';

<Pulse>
  <Badge>Novo</Badge>
</Pulse>

<Floating duration={3} distance={10}>
  <Icon />
</Floating>

<BounceIn delay={0.2}>
  <Alert />
</BounceIn>

<SlideIn direction="left">
  <Sidebar />
</SlideIn>
```

## Exemplos

### Exemplo 1: Card com Hover e Click

```tsx
import { motion } from 'framer-motion';
import { cardHover } from '@/lib/animations';

function ProductCard({ product }) {
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className="p-6 bg-white rounded-lg shadow-md cursor-pointer"
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </motion.div>
  );
}
```

### Exemplo 2: Lista com Scroll Reveal

```tsx
import { ScrollReveal, StaggerList, StaggerItem } from '@/lib/animations';

function FeaturesList({ features }) {
  return (
    <ScrollReveal>
      <StaggerList>
        {features.map(feature => (
          <StaggerItem key={feature.id}>
            <FeatureCard feature={feature} />
          </StaggerItem>
        ))}
      </StaggerList>
    </ScrollReveal>
  );
}
```

### Exemplo 3: Dashboard com Métricas Animadas

```tsx
import { CountUp, AnimatedProgress, FadeInUp } from '@/lib/animations';

function Dashboard({ metrics }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <FadeInUp delay={0}>
        <Card>
          <h3>Total de Usuários</h3>
          <CountUp value={metrics.users} suffix=" users" />
        </Card>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <Card>
          <h3>Taxa de Conversão</h3>
          <CountUp value={metrics.conversion} suffix="%" />
          <AnimatedProgress value={metrics.conversion} />
        </Card>
      </FadeInUp>

      <FadeInUp delay={0.2}>
        <Card>
          <h3>Receita Mensal</h3>
          <CountUp value={metrics.revenue} prefix="R$ " />
        </Card>
      </FadeInUp>
    </div>
  );
}
```

### Exemplo 4: Modal com Backdrop

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdrop, modalContent } from '@/lib/animations';

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 max-w-md">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Exemplo 5: Page Transitions com React Router

```tsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/lib/animations';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
}
```

## Boas Práticas

### 1. Respeite Preferências de Motion

Sempre use `useReducedMotion` para respeitar a preferência do usuário:

```tsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
>
  Conteúdo
</motion.div>
```

### 2. Use Delays com Moderação

Não abuse de delays longos - usuários não querem esperar:

```tsx
// ❌ Ruim - delay muito longo
<FadeIn delay={2}>Content</FadeIn>

// ✅ Bom - delay curto
<FadeIn delay={0.2}>Content</FadeIn>
```

### 3. Animações de Performance

Use `transform` e `opacity` para melhor performance:

```tsx
// ✅ Bom - usa transform (GPU accelerated)
<motion.div animate={{ x: 100, scale: 1.2 }} />

// ❌ Ruim - usa width/height (layout)
<motion.div animate={{ width: 200, height: 300 }} />
```

### 4. Cleanup de Animações

AnimatePresence cuida do cleanup automaticamente:

```tsx
<AnimatePresence>
  {isVisible && (
    <motion.div exit={{ opacity: 0 }}>
      Conteúdo removido com animação
    </motion.div>
  )}
</AnimatePresence>
```

### 5. Stagger com Layout

Use `layout` para animações fluidas de reordenação:

```tsx
<motion.div layout>
  {items.map(item => (
    <motion.div key={item.id} layout>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### 6. Throttle/Debounce em Scroll

Para scroll listeners, considere throttle:

```tsx
useEffect(() => {
  const handleScroll = throttle(() => {
    // Lógica de animação
  }, 100);

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### 7. Initial={false} para Evitar Flash

Use `initial={false}` quando o componente já está montado:

```tsx
<AnimatePresence initial={false}>
  {items.map(item => (
    <motion.div key={item.id}>
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

## Referências

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Best Practices](https://web.dev/animations/)
- [Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
