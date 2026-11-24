namespace Cubex.Api.Services;

public interface IScrambleService
{
    string Generate3x3Scramble(int length = 20);
    string GenerateCrossScramble();
    string GenerateF2LScramble();
    string GenerateOLLScramble();
    string GeneratePLLScramble();
}
