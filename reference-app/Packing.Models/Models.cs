using System.Text;

namespace Packing.Models;
public record ScanMessage(string Barcode, DateTime Time, int Count);

public static class BarcodeFunctions
{
    public static string CreateBarCode()
    {
        var random = new Random();
        var barcode = new StringBuilder();
        //random barcode in the form 123-456-89
        const string chars = "0123456789";
        barcode.Clear();
        for (int i = 0; i < 12; i++)
        {
            if (i % 4 == 0 && i != 0)
            {
                barcode.Append('-');
            }

            barcode.Append(chars[random.Next(chars.Length)]);
        }

        return barcode.ToString();
    }
}