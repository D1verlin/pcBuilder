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

        public BuildService(
            IPcComponentRepository componentRepository,
            IBenchmarkRepository benchmarkRepository)
        {
            _componentRepository = componentRepository;
            _benchmarkRepository = benchmarkRepository;
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
