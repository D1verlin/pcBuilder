using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PcBuilder.Domain.Entities;
using PcBuilder.Infrastructure.Data;

namespace PcBuilder.Infrastructure.Services
{
    public class SeedDataService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHostEnvironment _env;
        private readonly ILogger<SeedDataService> _logger;

        public SeedDataService(
            ApplicationDbContext context,
            IHostEnvironment env,
            ILogger<SeedDataService> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }

        public async Task SeedAllAsync()
        {
            try
            {
                var dataPath = Path.Combine(_env.ContentRootPath, "Data");
                if (!Directory.Exists(dataPath))
                {
                    _logger.LogWarning("Директория данных не найдена: {Path}", dataPath);
                    return;
                }

                await ClearExistingDataAsync();

                foreach (var file in Directory.GetFiles(dataPath, "*.json"))
                {
                    var categorySlug = NormalizeSlug(Path.GetFileNameWithoutExtension(file));
                    await SeedCategoryFromFileAsync(file, categorySlug);
                }

                await SeedScenariosAsync();
                await SeedManualComponentsAsync();
                await SeedBenchmarksAsync();

                _logger.LogInformation("Заполнение базы данных завершено успешно.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при заполнении базы данных.");
            }
        }

        private async Task ClearExistingDataAsync()
        {
            _logger.LogInformation("Очистка существующих данных...");
            await _context.BenchmarkResults.ExecuteDeleteAsync();
            await _context.BenchmarkScenarios.ExecuteDeleteAsync();
            await _context.PcComponents.ExecuteDeleteAsync();
        }

        private async Task SeedCategoryFromFileAsync(string filePath, string categorySlug)
        {
            _logger.LogInformation("Заполнение категории: {Category}", categorySlug);

            var dbCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == categorySlug);
            if (dbCategory == null)
            {
                _logger.LogWarning("Категория с slug '{Slug}' не найдена. Пропуск.", categorySlug);
                return;
            }

            var jsonContent = await File.ReadAllTextAsync(filePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, AllowTrailingCommas = true };
            var rawData = JsonSerializer.Deserialize<List<JsonElement>>(jsonContent, options);
            if (rawData == null) return;

            var components = ParseComponentsFromJson(rawData, dbCategory, categorySlug);
            await SaveInBatchesAsync(components, categorySlug);
        }

        private List<PcComponent> ParseComponentsFromJson(
            List<JsonElement> rawData, Category dbCategory, string categorySlug)
        {
            var components = new List<PcComponent>();

            foreach (var element in rawData)
            {
                try
                {
                    var component = ParseSingleComponent(element, dbCategory, categorySlug);
                    if (component != null) components.Add(component);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Пропуск компонента в {Category}: {Message}", categorySlug, ex.Message);
                }
            }

            return components;
        }

        private PcComponent? ParseSingleComponent(JsonElement element, Category dbCategory, string categorySlug)
        {
            var name = element.TryGetProperty("name", out var n) ? n.GetString() : null;
            if (string.IsNullOrEmpty(name)) return null;

            decimal? price = ParsePrice(element);
            string socket = ParseSocket(element, name);
            string memoryType = ParseMemoryType(element, name, categorySlug, socket);
            string formFactor = element.TryGetProperty("form_factor", out var ff) ? ff.GetString() ?? "" : "";
            int tdp = ParseTdp(element);
            string specsJson = BuildSpecsJson(element);

            return new PcComponent
            {
                Name = name,
                CategoryId = dbCategory.Id,
                CategoryName = dbCategory.Name,
                Price = price ?? 0,
                Brand = ExtractBrand(name),
                Socket = socket,
                MemoryType = memoryType,
                FormFactor = formFactor,
                Tdp = tdp,
                SpecsJson = specsJson
            };
        }

        private static decimal? ParsePrice(JsonElement element)
        {
            if (!element.TryGetProperty("price", out var p) || p.ValueKind == JsonValueKind.Null) return null;
            if (p.ValueKind == JsonValueKind.Number) return p.GetDecimal();
            if (p.ValueKind == JsonValueKind.String && decimal.TryParse(p.GetString(), out var dp)) return dp;
            return null;
        }

        private string ParseSocket(JsonElement element, string name)
        {
            string socket = element.TryGetProperty("socket", out var s) ? s.GetString() ?? "" : "";
            return string.IsNullOrEmpty(socket) || socket == "N/A" ? InferSocket(name, element) : socket;
        }

        private string ParseMemoryType(JsonElement element, string name, string categorySlug, string socket)
        {
            string memoryType = element.TryGetProperty("memory_type", out var mt) ? mt.GetString() ?? "" : "";
            return string.IsNullOrEmpty(memoryType) || memoryType == "N/A"
                ? InferMemoryType(name, categorySlug, socket)
                : memoryType;
        }

        private static int ParseTdp(JsonElement element)
        {
            if (element.TryGetProperty("tdp", out var t))
            {
                if (t.ValueKind == JsonValueKind.Number) return t.GetInt32();
                if (t.ValueKind == JsonValueKind.String && int.TryParse(t.GetString(), out var dt)) return dt;
            }
            if (element.TryGetProperty("wattage", out var w) && w.ValueKind == JsonValueKind.Number)
                return w.GetInt32();
            return 0;
        }

        private static string BuildSpecsJson(JsonElement element)
        {
            var specsDict = new Dictionary<string, object>();
            foreach (var prop in element.EnumerateObject())
            {
                if (prop.Name.Equals("name", StringComparison.OrdinalIgnoreCase) ||
                    prop.Name.Equals("price", StringComparison.OrdinalIgnoreCase)) continue;

                specsDict[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString() ?? "",
                    JsonValueKind.Number => prop.Value.GetDouble(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    _ => prop.Value.ToString()
                };
            }
            return JsonSerializer.Serialize(specsDict);
        }

        private async Task SaveInBatchesAsync(List<PcComponent> components, string categorySlug)
        {
            const int batchSize = 500;
            for (int i = 0; i < components.Count; i += batchSize)
            {
                try
                {
                    var batch = components.Skip(i).Take(batchSize).ToList();
                    _context.PcComponents.AddRange(batch);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка при сохранении пакета для {Category}", categorySlug);
                    _context.ChangeTracker.Clear();
                }
            }
        }

        private static string InferSocket(string name, JsonElement element)
        {
            string micro = element.TryGetProperty("microarchitecture", out var m) ? m.GetString() ?? "" : "";

            if (name.Contains("LGA1700") || micro.Contains("Alder Lake") || micro.Contains("Raptor Lake")) return "LGA1700";
            if (name.Contains("LGA1200") || micro.Contains("Comet Lake") || micro.Contains("Rocket Lake")) return "LGA1200";
            if (name.Contains("LGA1151") || micro.Contains("Coffee Lake") || micro.Contains("Kaby Lake")) return "LGA1151";
            if (name.Contains("LGA1851") || micro.Contains("Arrow Lake")) return "LGA1851";
            if (name.Contains("AM5") || micro.Contains("Zen 4") || micro.Contains("Zen 5")) return "AM5";
            if (name.Contains("AM4") || micro.Contains("Zen 3") || micro.Contains("Zen 2") || micro.Contains("Zen")) return "AM4";
            if (name.Contains("TR4") || name.Contains("Threadripper")) return "sTR4";

            return "N/A";
        }

        private static string InferMemoryType(string name, string categorySlug, string socket)
        {
            if (name.Contains("DDR5", StringComparison.OrdinalIgnoreCase)) return "DDR5";
            if (name.Contains("DDR4", StringComparison.OrdinalIgnoreCase)) return "DDR4";
            if (name.Contains("DDR3", StringComparison.OrdinalIgnoreCase)) return "DDR3";

            if (categorySlug == "motherboard")
            {
                if (socket is "AM5" or "LGA1851") return "DDR5";
                if (socket is "AM4" or "LGA1200" or "LGA1151") return "DDR4";
            }

            return "N/A";
        }

        private static string NormalizeSlug(string fileName)
        {
            return fileName.ToLower() switch
            {
                "cpu" => "cpu",
                "motherboard" => "motherboard",
                "ram" or "memory" => "ram",
                "gpu" => "gpu",
                "storage" => "storage",
                "psu" => "psu",
                "case" => "case",
                _ => fileName.ToLower()
            };
        }

        private static string ExtractBrand(string name)
        {
            var parts = name.Split(' ');
            return parts.Length > 0 ? parts[0] : "Unknown";
        }

        private async Task SeedManualComponentsAsync()
        {
            _logger.LogInformation("Добавление вручную заданных компонентов...");
            var existingNames = await _context.PcComponents.Select(c => c.Name).ToHashSetAsync();

            var manualComponents = CreateManualComponents();
            foreach (var item in manualComponents.Where(c => !existingNames.Contains(c.Name)))
                _context.PcComponents.Add(item);

            await _context.SaveChangesAsync();
        }

        private static List<PcComponent> CreateManualComponents()
        {
            return new List<PcComponent>
            {
                new() { CategoryId = 1, Name = "AMD Ryzen 7 7800X3D", Price = 449.99m, Tdp = 120, Socket = "AM5", MemoryType = "DDR5", Brand = "AMD", SpecsJson = "{\"Cores\":8,\"Threads\":16,\"BoostClock\":\"5.0 GHz\"}" },
                new() { CategoryId = 1, Name = "Intel Core i7-13700K", Price = 389.99m, Tdp = 125, Socket = "LGA1700", MemoryType = "DDR5", Brand = "Intel", SpecsJson = "{\"Cores\":16,\"Threads\":24}" },
                new() { CategoryId = 4, Name = "NVIDIA GeForce RTX 4080 Super", Price = 999.99m, Tdp = 320, Brand = "NVIDIA", SpecsJson = "{\"VRAM\":\"16GB\",\"Chipset\":\"RTX 4080 Super\"}" },
                new() { CategoryId = 4, Name = "AMD Radeon RX 7800 XT", Price = 499.99m, Tdp = 263, Brand = "AMD", SpecsJson = "{\"VRAM\":\"16GB\",\"Chipset\":\"RX 7800 XT\"}" },
                new() { CategoryId = 4, Name = "NVIDIA GeForce RTX 3060 12GB", Price = 289.99m, Tdp = 170, Brand = "NVIDIA", SpecsJson = "{\"VRAM\":\"12GB\",\"Chipset\":\"RTX 3060\"}" },
                new() { CategoryId = 3, Name = "G.Skill Flare X5 32GB (2x16) DDR5-6000", Price = 104.99m, Tdp = 5, MemoryType = "DDR5", Brand = "G.Skill", SpecsJson = "{\"Capacity\":\"32GB\",\"Speed\":\"6000\"}" },
                new() { CategoryId = 5, Name = "WD Black SN850X 2TB", Price = 159.99m, Tdp = 8, FormFactor = "M.2", Brand = "WD", SpecsJson = "{\"Capacity\":\"2TB\",\"Interface\":\"PCIe 4.0\"}" }
            };
        }

        private async Task SeedScenariosAsync()
        {
            _logger.LogInformation("Добавление сценариев бенчмарков...");

            var scenarios = new List<BenchmarkScenario>
            {
                new() { Name = "Cinebench R23 (Multi-Core)", Category = "CPU", Unit = "pts", Icon = "analytics", Description = "Рендеринг на всех ядрах процессора" },
                new() { Name = "Geekbench 6 (Single-Core)", Category = "CPU", Unit = "pts", Icon = "speed", Description = "Однопоточная производительность" },
                new() { Name = "Blender Benchmark (CPU)", Category = "CPU", Unit = "s", Icon = "view_in_ar", Description = "Время рендеринга сцены на CPU" },
                new() { Name = "Cyberpunk 2077 (4K Ultra RT)", Category = "GPU", Unit = "FPS", Icon = "sports_esports", Description = "Геймплей в 4K с трассировкой лучей" },
                new() { Name = "DaVinci Resolve (Render 4K)", Category = "GPU", Unit = "min", Icon = "movie_edit", Description = "Экспорт 10-минутного 4K видео" },
                new() { Name = "Blender (Render)", Category = "GPU", Unit = "s", Icon = "view_in_ar", Description = "Финальный рендеринг кадра на GPU" }
            };

            _context.BenchmarkScenarios.AddRange(scenarios);
            await _context.SaveChangesAsync();
        }

        private async Task SeedBenchmarksAsync()
        {
            _logger.LogInformation("Генерация результатов бенчмарков...");
            await _context.BenchmarkResults.ExecuteDeleteAsync();

            var components = await _context.PcComponents.ToListAsync();
            var benchmarks = GenerateBenchmarksForComponents(components);

            if (benchmarks.Any())
            {
                _context.BenchmarkResults.AddRange(benchmarks);
                await _context.SaveChangesAsync();
            }
        }

        private static List<BenchmarkResult> GenerateBenchmarksForComponents(List<PcComponent> components)
        {
            var benchmarks = new List<BenchmarkResult>();
            var processedIds = new HashSet<int>();

            foreach (var comp in components)
            {
                var generated = GenerateBenchmarksForComponent(comp);
                benchmarks.AddRange(generated);
                if (generated.Any()) processedIds.Add(comp.Id);
            }

            AddFallbackBenchmarks(components, processedIds, benchmarks);
            return benchmarks;
        }

        private static List<BenchmarkResult> GenerateBenchmarksForComponent(PcComponent comp)
        {
            var results = new List<BenchmarkResult>();
            var targetName = comp.Name?.ToLower() ?? "";

            if (comp.CategoryId == 1) results.AddRange(GenerateCpuBenchmarks(comp, targetName));
            if (comp.CategoryId == 4) results.AddRange(GenerateGpuBenchmarks(comp, targetName));
            if (comp.CategoryId == 3) results.AddRange(GenerateRamBenchmarks(comp, targetName));
            if (comp.CategoryId == 5) results.AddRange(GenerateStorageBenchmarks(comp, targetName));

            return results;
        }

        private static IEnumerable<BenchmarkResult> GenerateCpuBenchmarks(PcComponent comp, string name)
        {
            var rnd = new Random(comp.Id);
            int cinebench = CalculateCinebenchScore(comp, name) + rnd.Next(-1000, 1000);
            int geekbench = CalculateGeekbenchScore(comp, name) + rnd.Next(-100, 100);

            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Cinebench R23 (Multi-Core)", Score = cinebench.ToString("N0"), Unit = "pts" };
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Geekbench 6 (Single-Core)", Score = geekbench.ToString("N0"), Unit = "pts" };
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Blender Benchmark (CPU)", Score = (800 - cinebench / 60.0).ToString("F1"), Unit = "s" };
        }

        private static int CalculateCinebenchScore(PcComponent comp, string name)
        {
            if (name.Contains("14900k")) return 40250;
            if (name.Contains("7950x")) return 38402;
            if (name.Contains("13600k")) return 24100;
            if (name.Contains("7800x3d")) return 18500;
            return comp.Price > 500 ? 38000 : comp.Price > 300 ? 24000 : comp.Price > 150 ? 15000 : 8000;
        }

        private static int CalculateGeekbenchScore(PcComponent comp, string name)
        {
            if (name.Contains("14900k")) return 3150;
            if (name.Contains("7950x")) return 2950;
            if (name.Contains("13600k")) return 2650;
            if (name.Contains("7800x3d")) return 2750;
            return comp.Price > 500 ? 3200 : comp.Price > 300 ? 2800 : comp.Price > 150 ? 2200 : 1600;
        }

        private static IEnumerable<BenchmarkResult> GenerateGpuBenchmarks(PcComponent comp, string name)
        {
            int fps = CalculateGpuFps(comp, name);
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Cyberpunk 2077 (4K Ultra RT)", Score = fps.ToString(), Unit = "FPS" };
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "DaVinci Resolve (Render 4K)", Score = (20.0 - fps / 5.0).ToString("F1"), Unit = "min" };
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Blender (Render)", Score = (60.0 - fps / 1.5).ToString("F1"), Unit = "s" };
        }

        private static int CalculateGpuFps(PcComponent comp, string name)
        {
            if (name.Contains("4090")) return 65;
            if (name.Contains("4080")) return 55;
            if (name.Contains("7900 xtx")) return 52;
            if (name.Contains("4070")) return 40;
            if (name.Contains("3060")) return 25;
            return comp.Price > 1000 ? 60 : comp.Price > 600 ? 45 : comp.Price > 300 ? 30 : 15;
        }

        private static IEnumerable<BenchmarkResult> GenerateRamBenchmarks(PcComponent comp, string name)
        {
            int speed = ParseRamSpeed(name);
            double bandwidth = speed / 100.0 + (double)(comp.Price / 20m);
            double latency = 80.0 - speed / 200.0;

            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Bandwidth (RAM)", Score = bandwidth.ToString("F1"), Unit = "GB/s" };
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Latency (RAM)", Score = latency.ToString("F1"), Unit = "ns" };
        }

        private static int ParseRamSpeed(string name)
        {
            if (name.Contains("6400")) return 6400;
            if (name.Contains("6000")) return 6000;
            if (name.Contains("3600")) return 3600;
            if (name.Contains("3200")) return 3200;
            return 5200;
        }

        private static IEnumerable<BenchmarkResult> GenerateStorageBenchmarks(PcComponent comp, string name)
        {
            var (read, write) = CalculateStorageSpeed(name);
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Read (NVMe)", Score = read.ToString("N0"), Unit = "MB/s" };
            yield return new BenchmarkResult { PcComponentId = comp.Id, Type = "Write (NVMe)", Score = write.ToString("N0"), Unit = "MB/s" };
        }

        private static (int Read, int Write) CalculateStorageSpeed(string name)
        {
            if (name.Contains("990 pro")) return (7450, 6900);
            if (name.Contains("980 pro")) return (7000, 5000);
            if (name.Contains("p3 plus")) return (5000, 3600);
            if (name.Contains("sn850x")) return (7300, 6300);
            return (3500, 3000);
        }

        private static void AddFallbackBenchmarks(
            List<PcComponent> components, HashSet<int> processedIds, List<BenchmarkResult> benchmarks)
        {
            foreach (var comp in components.Where(c => !processedIds.Contains(c.Id)))
            {
                if (comp.CategoryId == 1)
                {
                    benchmarks.Add(new BenchmarkResult { PcComponentId = comp.Id, Type = "Cinebench R23 (Multi-Core)", Score = "12000", Unit = "pts" });
                    benchmarks.Add(new BenchmarkResult { PcComponentId = comp.Id, Type = "Geekbench 6 (Single-Core)", Score = "1800", Unit = "pts" });
                }
                else if (comp.CategoryId == 4)
                    benchmarks.Add(new BenchmarkResult { PcComponentId = comp.Id, Type = "Cyberpunk 2077 (4K Ultra RT)", Score = "25", Unit = "FPS" });
                else if (comp.CategoryId == 3)
                    benchmarks.Add(new BenchmarkResult { PcComponentId = comp.Id, Type = "Bandwidth (RAM)", Score = "45.0", Unit = "GB/s" });
                else if (comp.CategoryId == 5)
                    benchmarks.Add(new BenchmarkResult { PcComponentId = comp.Id, Type = "Read (NVMe)", Score = "2500", Unit = "MB/s" });
            }
        }
    }
}
