namespace Peanut.Packing.Models;

public record PackingScannerMessage(int Id, string Barcode, DateTime Time);
public record Conveyor(string Name);