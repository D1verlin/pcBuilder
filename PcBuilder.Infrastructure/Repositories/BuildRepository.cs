using Microsoft.EntityFrameworkCore;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;
using PcBuilder.Infrastructure.Data;

namespace PcBuilder.Infrastructure.Repositories
{
    public class BuildRepository : IBuildRepository
    {
        private readonly ApplicationDbContext _context;

        public BuildRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Build?> GetByIdAsync(Guid id)
        {
            return await _context.Builds.FindAsync(id);
        }

        public async Task<Build?> GetByShareCodeAsync(string shareCode)
        {
            return await _context.Builds
                .Include(b => b.Cpu)
                .Include(b => b.Motherboard)
                .Include(b => b.Ram)
                .Include(b => b.Gpu)
                .Include(b => b.Storage)
                .Include(b => b.Psu)
                .FirstOrDefaultAsync(b => b.ShareCode == shareCode);
        }

        public async Task<(IReadOnlyList<Build> Items, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.Builds
                .Include(b => b.Cpu)
                .Include(b => b.Motherboard)
                .Include(b => b.Ram)
                .Include(b => b.Gpu)
                .Include(b => b.Storage)
                .Include(b => b.Psu)
                .Include(b => b.Case)
                .OrderByDescending(b => b.CreatedAt);

            int totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<Build> AddAsync(Build build)
        {
            _context.Builds.Add(build);
            await _context.SaveChangesAsync();
            return build;
        }

        public async Task DeleteAsync(Build build)
        {
            _context.Builds.Remove(build);
            await _context.SaveChangesAsync();
        }
    }
}
