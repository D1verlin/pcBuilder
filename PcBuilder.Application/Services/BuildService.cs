using System.Text.Json;
using PcBuilder.Application.DTOs;
using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;

namespace PcBuilder.Application.Services
{
    public class BuildService : IBuildService
    {
        private readonly IPcComponentRepository _componentRepository;
        private readonly IBenchmarkRepository _benchmarkRepository;
        private readonly IBuildRepository _buildRepository;

        public BuildService(
            IPcComponentRepository componentRepository,
            IBenchmarkRepository benchmarkRepository,
            IBuildRepository buildRepository)
        {
            _componentRepository = componentRepository;
            _benchmarkRepository = benchmarkRepository;
            _buildRepository = buildRepository;
        }

        public async Task<CompatibilityResultDto> ValidateCompatibilityAsync(BuildRequestDto request)
        {
            var result = new CompatibilityResultDto();

            var cpu = await FindComponentAsync(request.CpuId);
            var motherboard = await FindComponentAsync(request.MotherboardId);
            var ram = await FindComponentAsync(request.RamId);
            var gpu = await FindComponentAsync(request.GpuId);
            var storage = await FindComponentAsync(request.StorageId);
            var psu = await FindComponentAsync(request.PsuId);

            CheckCpuMotherboardSocketCompatibility(cpu, motherboard, result);
            CheckRamMotherboardCompatibility(motherboard, ram, result);

            result.EstimatedWattage = CalculateTotalTdp(cpu, gpu, motherboard, storage, ram);

            CheckPsuPowerAdequacy(psu, result.EstimatedWattage, result);

            return result;
        }

        public async Task<IReadOnlyList<BenchmarkResultDto>> GetBuildBenchmarksAsync(BuildRequestDto request)
        {
            var componentIds = request.GetComponentIds().ToList();
            if (!componentIds.Any())
                return new List<BenchmarkResultDto>();

            var benchmarks = await _benchmarkRepository.GetByComponentIdsAsync(componentIds);

            return benchmarks.Select(b => new BenchmarkResultDto
            {
                Id = b.Id,
                PcComponentId = b.PcComponentId,
                ComponentName = b.PcComponent?.Name ?? string.Empty,
                Type = b.Type,
                Score = b.Score,
                Unit = b.Unit
            }).ToList();
        }

        public async Task<SaveBuildResponseDto> SaveBuildAsync(SaveBuildRequestDto request)
        {
            var cpu        = await FindComponentAsync(request.CpuId);
            var motherboard = await FindComponentAsync(request.MotherboardId);
            var ram        = await FindComponentAsync(request.RamId);
            var gpu        = await FindComponentAsync(request.GpuId);
            var storage    = await FindComponentAsync(request.StorageId);
            var psu        = await FindComponentAsync(request.PsuId);

            var build = new Domain.Entities.Build
            {
                Name            = request.Name,
                ShareCode       = GenerateShareCode(),
                CpuId           = request.CpuId,
                MotherboardId   = request.MotherboardId,
                RamId           = request.RamId,
                GpuId           = request.GpuId,
                StorageId       = request.StorageId,
                PsuId           = request.PsuId,
                TotalPrice      = (cpu?.Price ?? 0) + (motherboard?.Price ?? 0) + (ram?.Price ?? 0)
                                + (gpu?.Price ?? 0) + (storage?.Price ?? 0) + (psu?.Price ?? 0),
                EstimatedWattage = CalculateTotalTdp(cpu, motherboard, gpu, storage, ram)
            };

            var saved = await _buildRepository.AddAsync(build);

            return new SaveBuildResponseDto
            {
                Id        = saved.Id,
                ShareCode = saved.ShareCode,
                Name      = saved.Name
            };
        }

        public async Task<BuildDetailDto?> GetBuildByShareCodeAsync(string shareCode)
        {
            var build = await _buildRepository.GetByShareCodeAsync(shareCode);
            if (build == null) return null;

            return new BuildDetailDto
            {
                Id               = build.Id,
                Name             = build.Name,
                ShareCode        = build.ShareCode,
                TotalPrice       = build.TotalPrice,
                EstimatedWattage = build.EstimatedWattage,
                Cpu              = MapComponent(build.Cpu),
                Motherboard      = MapComponent(build.Motherboard),
                Ram              = MapComponent(build.Ram),
                Gpu              = MapComponent(build.Gpu),
                Storage          = MapComponent(build.Storage),
                Psu              = MapComponent(build.Psu)
            };
        }

        private static BuildComponentDto? MapComponent(Domain.Entities.PcComponent? comp)
        {
            if (comp == null) return null;
            return new BuildComponentDto
            {
                Id           = comp.Id,
                Name         = comp.Name,
                CategoryName = comp.CategoryName ?? string.Empty,
                Price        = comp.Price,
                Tdp          = comp.Tdp,
                Socket       = comp.Socket ?? string.Empty,
                FormFactor   = comp.FormFactor ?? string.Empty,
                MemoryType   = comp.MemoryType ?? string.Empty,
                Brand        = comp.Brand ?? string.Empty,
                SpecsJson    = comp.SpecsJson ?? string.Empty
            };
        }

        private static string GenerateShareCode()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
            var random = new Random();
            return new string(Enumerable.Range(0, 8).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        }

        private async Task<PcComponent?> FindComponentAsync(int? id)
        {
            return id.HasValue ? await _componentRepository.GetByIdAsync(id.Value) : null;
        }

        private static void CheckCpuMotherboardSocketCompatibility(
            PcComponent? cpu, PcComponent? motherboard, CompatibilityResultDto result)
        {
            if (cpu == null || motherboard == null) return;

            if (cpu.Socket != motherboard.Socket)
            {
                result.IsCompatible = false;
                result.Errors.Add(
                    $"Процессор ({cpu.Socket}) не совместим с материнской платой ({motherboard.Socket}).");
            }
        }

        private static void CheckRamMotherboardCompatibility(
            PcComponent? motherboard, PcComponent? ram, CompatibilityResultDto result)
        {
            if (motherboard == null || ram == null) return;

            if (motherboard.MemoryType != ram.MemoryType)
            {
                result.IsCompatible = false;
                result.Errors.Add(
                    $"Материнская плата поддерживает {motherboard.MemoryType}, а выбрана память {ram.MemoryType}.");
            }
        }

        private static int CalculateTotalTdp(params PcComponent?[] components)
        {
            return components.Where(c => c != null).Sum(c => c!.Tdp);
        }

        private static void CheckPsuPowerAdequacy(
            PcComponent? psu, int totalTdp, CompatibilityResultDto result)
        {
            if (psu == null)
            {
                if (totalTdp > 0)
                    result.Warnings.Add("Блок питания не выбран. Невозможно проверить совместимость по питанию.");
                return;
            }

            int psuWattage = ParsePsuWattage(psu.SpecsJson);
            if (psuWattage <= 0) return;

            if (psuWattage < totalTdp)
            {
                result.IsCompatible = false;
                result.Errors.Add(
                    $"Блок питания ({psuWattage}W) слишком слаб. Потребление сборки: {totalTdp}W.");
            }
            else if (psuWattage < totalTdp * 1.2)
            {
                result.Warnings.Add(
                    $"Блок питания ({psuWattage}W) работает на пределе. " +
                    $"Рекомендуется минимум {Math.Ceiling(totalTdp * 1.2)}W (запас 20%).");
            }
        }

        private static int ParsePsuWattage(string specsJson)
        {
            try
            {
                var specs = JsonDocument.Parse(specsJson);
                if (specs.RootElement.TryGetProperty("wattage", out var prop) ||
                    specs.RootElement.TryGetProperty("Wattage", out prop))
                {
                    string raw = prop.ValueKind == JsonValueKind.Number
                        ? prop.GetRawText()
                        : prop.GetString()?.Replace("W", "").Trim() ?? "0";

                    int.TryParse(raw, out int wattage);
                    return wattage;
                }
            }
            catch { /* некорректный JSON — игнорируем */ }

            return 0;
        }
    }
}
