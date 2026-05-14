using PcBuilder.Application.DTOs;
using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;

namespace PcBuilder.Application.Services
{
    public class ComponentService : IComponentService
    {
        private readonly IPcComponentRepository _componentRepository;

        public ComponentService(IPcComponentRepository componentRepository)
        {
            _componentRepository = componentRepository;
        }

        public async Task<PagedResultDto<PcComponent>> GetPagedComponentsAsync(ComponentFilterDto filter)
        {
            var (items, totalCount) = await _componentRepository.GetPagedAsync(
                filter.CategoryId,
                filter.Slug,
                filter.Search,
                filter.Brand,
                filter.Socket,
                filter.FormFactor,
                filter.MemoryType,
                filter.SortBy,
                filter.Page,
                filter.PageSize);

            return new PagedResultDto<PcComponent>(items, totalCount);
        }

        public async Task<PcComponent?> GetComponentByIdAsync(int id)
        {
            return await _componentRepository.GetByIdWithCategoryAsync(id);
        }

        public async Task<ComponentFiltersDto> GetFiltersForCategoryAsync(int categoryId)
        {
            var brands = await _componentRepository.GetDistinctBrandsAsync(categoryId);
            var sockets = await _componentRepository.GetDistinctSocketsAsync(categoryId);
            var formFactors = await _componentRepository.GetDistinctFormFactorsAsync(categoryId);
            var memoryTypes = await _componentRepository.GetDistinctMemoryTypesAsync(categoryId);

            return new ComponentFiltersDto
            {
                Brands = brands.OrderBy(b => b).ToList(),
                Sockets = sockets.OrderBy(s => s).ToList(),
                FormFactors = formFactors.OrderBy(f => f).ToList(),
                MemoryTypes = memoryTypes.OrderBy(m => m).ToList()
            };
        }

        public async Task<PcComponent> CreateComponentAsync(PcComponent component)
        {
            component.Id = 0;
            return await _componentRepository.AddAsync(component);
        }

        public async Task UpdateComponentAsync(PcComponent component)
        {
            await _componentRepository.UpdateAsync(component);
        }

        public async Task DeleteComponentAsync(int id)
        {
            var component = await _componentRepository.GetByIdAsync(id);
            if (component != null)
                await _componentRepository.DeleteAsync(component);
        }
    }
}
