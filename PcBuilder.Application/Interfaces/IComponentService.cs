using PcBuilder.Application.DTOs;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Application.Interfaces
{
    public interface IComponentService
    {
        Task<PagedResultDto<PcComponent>> GetPagedComponentsAsync(ComponentFilterDto filter);
        Task<PcComponent?> GetComponentByIdAsync(int id);
        Task<ComponentFiltersDto> GetFiltersForCategoryAsync(int categoryId);
        Task<PcComponent> CreateComponentAsync(PcComponent component);
        Task UpdateComponentAsync(PcComponent component);
        Task DeleteComponentAsync(int id);
    }
}
