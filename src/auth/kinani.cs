
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Emeuble.Models;

public partial class EmeubleDbContext : IdentityDbContext<User>
{
    public EmeubleDbContext()
    {
    }

    public EmeubleDbContext(DbContextOptions<EmeubleDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Reservation> Reservations { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=.;Database=Emeuble;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;");


   

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Reservation>(entity =>
        {


            entity.ToTable("Reservation");
            entity.HasKey(r => r.Nbr);

            entity.Property(e => e.AvanceContrat).HasColumnName("Avance_Contrat");
            entity.Property(e => e.CodeCadastre)
                .HasMaxLength(50)
                .HasColumnName("Code_Cadastre");
            entity.Property(e => e.CodeManfiaa)
                .HasMaxLength(50)
                .HasColumnName("Code_Manfiaa");
            entity.Property(e => e.Commercial).HasMaxLength(50);
            entity.Property(e => e.Consistance).HasMaxLength(50);
            entity.Property(e => e.ContratRéservation)
                .HasMaxLength(100)
                .HasColumnName("Contrat_Réservation");
            entity.Property(e => e.DateRéservation)
                .HasColumnType("datetime")
                .HasColumnName("Date_Réservation");
            entity.Property(e => e.NDuTitre13)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("N_du_Titre_13");
            entity.Property(e => e.NFraction).HasColumnName("N_fraction");
            entity.Property(e => e.NFraction2)
                .HasMaxLength(50)
                .HasColumnName("N_fraction2");
            entity.Property(e => e.Niveau).HasMaxLength(50);
            entity.Property(e => e.Nom)
                .HasMaxLength(50)
                .HasColumnName("NOM");
            entity.Property(e => e.Notaire).HasMaxLength(50);
            entity.Property(e => e.NumParking)
                .HasColumnType("money")
                .HasColumnName("Num_Parking");
            entity.Property(e => e.NuméroDUnité)
                .HasMaxLength(50)
                .HasColumnName("Numéro_d_unité");
            entity.Property(e => e.NuméroDeLaTaxeThTsc)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("Numéro_de_la_Taxe_Th_Tsc");
            entity.Property(e => e.PrixContrat).HasColumnName("Prix_Contrat");
            entity.Property(e => e.PrixDeVente).HasColumnName("Prix_de_Vente");
            entity.Property(e => e.PtéDite)
                .HasMaxLength(50)
                .HasColumnName("Pté_dite");
            entity.Property(e => e.RegCyndic)
                .HasMaxLength(100)
                .HasColumnName("Reg_Cyndic");
            entity.Property(e => e.ReliquatRèglementClt).HasColumnName("Reliquat_Règlement_Clt");
            entity.Property(e => e.Remarque).HasMaxLength(50);
            entity.Property(e => e.RésérvOui1Non0).HasColumnName("Résérv_Oui1_Non0");
            entity.Property(e => e.SignatureCvVi)
                .HasMaxLength(100)
                .HasColumnName("Signature_CV_VI");
            entity.Property(e => e.SuperficieCadastraleMag).HasColumnName("Superficie_Cadastrale_Mag");
            entity.Property(e => e.SuperficieCadastraleMezCad).HasColumnName("Superficie_Cadastrale_Mez_CAD");
            entity.Property(e => e.SuperficiePlancherCad).HasColumnName("Superficie_Plancher_CAD");
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.Téléphone).HasMaxLength(50);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
