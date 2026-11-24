namespace Cubex.Api.Services;

public class ScrambleService : IScrambleService
{
    private static readonly string[] Faces = { "U", "D", "L", "R", "F", "B" };
    private static readonly string[] Modifiers = { "", "'", "2" };
    private static readonly Random Rnd = new();

    public string Generate3x3Scramble(int length = 20)
    {
        var moves = new List<string>();
        int lastFace = -1;
        int secondLastFace = -1;

        for (int i = 0; i < length; i++)
        {
            int face;
            do
            {
                face = Rnd.Next(Faces.Length);
            } while (face == lastFace || (IsOpposite(face, lastFace) && face == secondLastFace));

            secondLastFace = lastFace;
            lastFace = face;

            string modifier = Modifiers[Rnd.Next(Modifiers.Length)];
            moves.Add(Faces[face] + modifier);
        }

        return string.Join(" ", moves);
    }

    private static bool IsOpposite(int face1, int face2)
    {
        // 0: U, 1: D -> Opposite (0, 1)
        // 2: L, 3: R -> Opposite (2, 3)
        // 4: F, 5: B -> Opposite (4, 5)
        return (face1 / 2) == (face2 / 2);
    }

    public string GenerateCrossScramble()
    {
        // Cross practice scrambles typically require 4-8 moves to solve cross
        return Generate3x3Scramble(14);
    }

    public string GenerateF2LScramble()
    {
        // Scramble where cross is solved and F2L pairs are scrambled
        var triggers = new[]
        {
            "R U R' U'", "R U' R'", "R U2 R' U'", "F' U' F", "y' R' U' R",
            "U R U' R'", "R U R'", "R' F R F'", "U' R U R' U R U R'"
        };
        var moves = new List<string>();
        for (int i = 0; i < 4; i++)
        {
            moves.Add(triggers[Rnd.Next(triggers.Length)]);
        }
        return string.Join(" ", moves);
    }

    public string GenerateOLLScramble()
    {
        // Generates an orientation case on top layer
        var ollSetups = new[]
        {
            "F R U R' U' F'",
            "f R U R' U' f'",
            "R U R' U R U2 R'",
            "R U2 R' U' R U' R'",
            "r U R' U' r' F R F'",
            "R' F R U R' U' F' R",
            "M U R U R' U' M2 U R U' r'"
        };
        return ollSetups[Rnd.Next(ollSetups.Length)];
    }

    public string GeneratePLLScramble()
    {
        // Standard PLL triggers (inverse setups)
        var pllSetups = new[]
        {
            "R U R' U' R' F R2 U' R' U' R U R' F'", // T-perm setup
            "R' U L' U2 R U' R' U2 R L", // Ja setup
            "M2 U M2 U2 M2 U M2", // H-perm setup
            "M2 U M U2 M' U M2", // Ua-perm setup
            "M2 U' M U2 M' U' M2", // Ub-perm setup
            "F R U' R' U' R U R' F' R U R' U' R' F R F'" // Y-perm setup
        };
        return pllSetups[Rnd.Next(pllSetups.Length)];
    }
}
