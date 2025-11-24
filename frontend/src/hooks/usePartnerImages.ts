import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CarouselSlide } from "@/components/ui/carousel";

interface PartnerImage {
  id: string;
  partner_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export const usePartnerImages = (partnerId: string) => {
  const [images, setImages] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load existing images
  useEffect(() => {
    loadImages();
  }, [partnerId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partner_images")
        .select("*")
        .eq("partner_id", partnerId)
        .order("display_order", { ascending: true });

      if (error) throw error;

      if (data) {
        const slides: CarouselSlide[] = await Promise.all(
          data.map(async (img: PartnerImage) => {
            // Get signed URL for the image (valid for 1 hour)
            const { data: urlData, error: urlError } = await supabase.storage
              .from("partner-images")
              .createSignedUrl(img.image_url, 3600);

            if (urlError) {
              console.error("Error creating signed URL:", urlError);
              return {
                src: "",
                alt: `Partner image ${img.display_order + 1}`,
              };
            }

            return {
              src: urlData?.signedUrl || "",
              alt: `Partner image ${img.display_order + 1}`,
            };
          })
        );
        setImages(slides);
      }
    } catch (error) {
      console.error("Error loading partner images:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<boolean> => {
    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${partnerId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("partner-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get current partner info to find matching partners in other groups
      const { data: currentPartner } = await supabase
        .from("partners")
        .select("nickname, user_id")
        .eq("id", partnerId)
        .single();

      if (!currentPartner) throw new Error("Partner not found");

      // Find all partners with same nickname and user_id (across all groups)
      const { data: matchingPartners } = await supabase
        .from("partners")
        .select("id")
        .eq("nickname", currentPartner.nickname)
        .eq("user_id", currentPartner.user_id);

      const partnerIds = matchingPartners?.map(p => p.id) || [partnerId];

      // For each matching partner, add the image reference
      for (const pid of partnerIds) {
        // Get current max display_order for this partner
        const { data: existingImages } = await supabase
          .from("partner_images")
          .select("display_order")
          .eq("partner_id", pid)
          .order("display_order", { ascending: false })
          .limit(1);

        const nextOrder = existingImages && existingImages.length > 0
          ? existingImages[0].display_order + 1
          : 0;

        // Save to database
        const { error: dbError } = await supabase
          .from("partner_images")
          .insert({
            partner_id: pid,
            image_url: fileName,
            display_order: nextOrder,
          });

        if (dbError) {
          console.error(`Error adding image to partner ${pid}:`, dbError);
        }
      }

      // Reload images
      await loadImages();
      return true;
    } catch (error) {
      console.error("Error uploading image:", error);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (index: number): Promise<boolean> => {
    try {
      if (index < 0 || index >= images.length) return false;

      // Get image data from database
      const { data: imageData } = await supabase
        .from("partner_images")
        .select("*")
        .eq("partner_id", partnerId)
        .order("display_order", { ascending: true });

      if (!imageData || !imageData[index]) return false;

      const imageToDelete = imageData[index];

      // Delete from storage (only once, since all partners share the same file)
      const { error: storageError } = await supabase.storage
        .from("partner-images")
        .remove([imageToDelete.image_url]);

      if (storageError) throw storageError;

      // Delete from ALL partners that reference this image_url
      // This ensures sync across groups
      const { error: dbError } = await supabase
        .from("partner_images")
        .delete()
        .eq("image_url", imageToDelete.image_url);

      if (dbError) throw dbError;

      // Reload images
      await loadImages();
      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  };

  const deleteAllImages = async (): Promise<boolean> => {
    try {
      // Get all images for this partner
      const { data: imageData } = await supabase
        .from("partner_images")
        .select("*")
        .eq("partner_id", partnerId);

      if (!imageData || imageData.length === 0) return true;

      // Delete from storage
      const filePaths = imageData.map((img: PartnerImage) => img.image_url);
      const { error: storageError } = await supabase.storage
        .from("partner-images")
        .remove(filePaths);

      if (storageError) throw storageError;

      // Delete from ALL partners that reference these image_urls
      // This ensures sync across groups
      for (const filePath of filePaths) {
        await supabase
          .from("partner_images")
          .delete()
          .eq("image_url", filePath);
      }

      setImages([]);
      return true;
    } catch (error) {
      console.error("Error deleting all images:", error);
      return false;
    }
  };

  return {
    images,
    loading,
    uploading,
    uploadImage,
    deleteImage,
    deleteAllImages,
    reloadImages: loadImages,
  };
};
