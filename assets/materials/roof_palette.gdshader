shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;
uniform sampler2D roof_texture : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform vec3 tile_color : source_color = vec3(0.18,0.37,0.48);
void fragment() {
	vec3 source = texture(roof_texture, UV).rgb;
	float luminance = dot(source, vec3(0.299,0.587,0.114));
	// Repaint only warm terracotta tiles; retain moss and grey trim.
	float warm = smoothstep(0.01,0.1,source.r-source.b) * smoothstep(-0.02,0.08,source.r-source.g);
	vec3 painted = tile_color * (0.45+luminance*1.9);
	ALBEDO = mix(source,painted,warm);
	ROUGHNESS = 0.88;
	SPECULAR = 0.22;
}
