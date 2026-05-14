using Microsoft.EntityFrameworkCore;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;
using PcBuilder.Infrastructure.Data;

namespace PcBuilder.Infrastructure.Repositories
{
    public class PcComponentRepository : BaseRepository<PcComponent>, IPcComponentRepository
    {
        public PcComponentRepository(ApplicationDbContext context) : base(context) { }

        public async Task<PcComponent?> GetByIdWithCategoryAsync(int id)
        {
            return await Context.PcComponents
                .Include(c => c.Category)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<PcComponent?> GetByIdWithBenchmarksAsync(int id)
        {
            return await Context.PcComponents
                .Include(c => c.Category)
                .Include(c => c.BenchmarkResults)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<(IReadOnlyList<PcComponent> Items, int TotalCount)> GetPagedAsync(
            int? categoryId, string? slug, string? search,
            string? brand, string? socket, string? formFactor,
            string? memoryType, string? sortBy, int page, int pageSize)
        {
            var query = BuildFilteredQuery(categoryId, slug, search, brand, socket, formFactor, memoryType);

            int totalCount = await query.CountAsync();
            query = ApplySorting(query, sortBy);

            var items = await query
                .Include(c => c.Category)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        private IQueryable<PcComponent> BuildFilteredQuery(
            int? categoryId, string? slug, string? search,
            string? brand, string? socket, string? formFactor, string? memoryType)
        {
            var query = Context.PcComponents.Where(c => c.Price > 0).AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(c => c.CategoryId == categoryId.Value);
            else if (!string.IsNullOrEmpty(slug))
                query = query.Where(c => c.Category!.Slug == slug);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(c => c.Name.ToLower().Contains(search.ToLower()));

            if (!string.IsNullOrEmpty(brand))
                query = query.Where(c => c.Brand == brand);

            if (!string.IsNullOrEmpty(socket))
                query = query.Where(c => c.Socket == socket);

            if (!string.IsNullOrEmpty(formFactor))
                query = query.Where(c => c.FormFactor == formFactor);

            if (!string.IsNullOrEmpty(memoryType))
                query = query.Where(c => c.MemoryType == memoryType);

            return query;
        }

        private static IQueryable<PcComponent> ApplySorting(IQueryable<PcComponent> query, string? sortBy)
        {
            return sortBy switch
            {
                "price_asc" => query.OrderBy(c => c.Price),
                "price_desc" => query.OrderByDescending(c => c.Price),
                _ => query.OrderBy(c => c.Name)
            };
        }

        public async Task<IReadOnlyList<string>> GetDistinctBrandsAsync(int categoryId)
        {
            return await Context.PcComponents
                .Where(c => c.CategoryId == categoryId && !string.IsNullOrEmpty(c.Brand) && c.Brand != "N/A")
                .Select(c => c.Brand)
                .Distinct()
                .ToListAsync();
        }

        public async Task<IReadOnlyList<string>> GetDistinctSocketsAsync(int categoryId)
        {
            return await Context.PcComponents
                .Where(c => c.CategoryId == categoryId && !string.IsNullOrEmpty(c.Socket) && c.Socket != "N/A")
                .Select(c => c.Socket)
                .Distinct()
                .ToListAsync();
        }

        public async Task<IReadOnlyList<string>> GetDistinctFormFactorsAsync(int categoryId)
        {
            return await Context.PcComponents
                .Where(c => c.CategoryId == categoryId && !string.IsNullOrEmpty(c.FormFactor) && c.FormFactor != "N/A")
                .Select(c => c.FormFactor)
                .Distinct()
                .ToListAsync();
        }

        public async Task<IReadOnlyList<string>> GetDistinctMemoryTypesAsync(int categoryId)
        {
            return await Context.PcComponents
                .Where(c => c.CategoryId == categoryId && !string.IsNullOrEmpty(c.MemoryType) && c.MemoryType != "N/A")
                .Select(c => c.MemoryType)
                .Distinct()
                .ToListAsync();
        }

        public async Task<IReadOnlyList<PcComponent>> GetByIdsAsync(IEnumerable<int> ids)
        {
            return await Context.PcComponents
                .Where(c => ids.Contains(c.Id))
                .ToListAsync();
        }
    }
}
