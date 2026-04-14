import { performance } from 'perf_hooks';

const mockData = Array.from({ length: 1000 }, (_, i) => ({
  id: `id-${i}`,
  name: `Name ${i}`,
  phoneNumbers: [
    { number: `123456789${i}` },
    { number: null },
    { number: undefined },
    { number: `987654321${i}` }
  ],
  emails: [
    { email: `email${i}@example.com` },
    { email: null },
    { email: undefined },
    { email: `email${i}-2@example.com` }
  ]
}));

function baseline(data) {
  return data.map(c => ({
    id: c.id,
    name: c.name,
    phoneNumbers: c.phoneNumbers?.map(p => p.number ?? '').filter(Boolean),
    emails: c.emails?.map(e => e.email ?? '').filter(Boolean),
  }));
}

function optimizedReduce(data) {
  return data.map(c => ({
    id: c.id,
    name: c.name,
    phoneNumbers: c.phoneNumbers?.reduce<string[]>((acc, p) => {
      if (p.number) acc.push(p.number);
      return acc;
    }, []),
    emails: c.emails?.reduce<string[]>((acc, e) => {
      if (e.email) acc.push(e.email);
      return acc;
    }, []),
  }));
}

function runBenchmark(name, fn, iterations = 100) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(mockData);
  }
  const end = performance.now();
  return end - start;
}

// Warmup
runBenchmark('Warmup Baseline', baseline, 10);
runBenchmark('Warmup Optimized Reduce', optimizedReduce, 10);

// Run
const baselineTime = runBenchmark('Baseline', baseline, 1000);
const optimizedReduceTime = runBenchmark('Optimized Reduce', optimizedReduce, 1000);

console.log(`Baseline time: ${baselineTime.toFixed(2)} ms`);
console.log(`Optimized Reduce time: ${optimizedReduceTime.toFixed(2)} ms`);
console.log(`Improvement: ${(((baselineTime - optimizedReduceTime) / baselineTime) * 100).toFixed(2)}%`);
